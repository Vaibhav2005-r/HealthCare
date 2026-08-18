"""Create and populate the operational ASHA and PHC worker directories.

This migration is intentionally idempotent: it only creates the new table and
upserts directory records. Existing clinical, alert, inventory, and case data
are never deleted.
"""

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

from seed_all_maharashtra_villages_and_phcs import MAHARASHTRA_DISTRICT_DATA


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DB_URL = os.getenv("SUPABASE_DB_URL")

PHC_ROLES = (
    ("medical_officer", "Dr. Aditi Deshmukh"),
    ("staff_nurse", "Nurse Priya Jadhav"),
    ("pharmacist", "Pharmacist Rohan Patil"),
)
ASHA_FIRST_NAMES = ("Sunita", "Anandi", "Kavita", "Meena", "Rekha", "Pooja", "Laxmi", "Savita")
ASHA_LAST_NAMES = ("Gaikwad", "Shinde", "Patil", "Kamble", "Jadhav", "Meshram", "Rathod", "Deshmukh")

CREATE_PHC_WORKERS_TABLE = """
CREATE TABLE IF NOT EXISTS public.phc_workers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code text UNIQUE NOT NULL,
    phone_number text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL CHECK (role IN ('medical_officer', 'staff_nurse', 'pharmacist', 'lab_technician', 'health_assistant')),
    phc_name text NOT NULL,
    block text,
    district text NOT NULL,
    state text NOT NULL DEFAULT 'Maharashtra',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_phc_workers_district ON public.phc_workers (district);
CREATE INDEX IF NOT EXISTS idx_phc_workers_phc_name ON public.phc_workers (phc_name);
"""


async def migrate_and_seed_workers() -> None:
    if not DB_URL or "YOUR-PASSWORD" in DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not configured in services/api/.env")

    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute(CREATE_PHC_WORKERS_TABLE)
        now = datetime.now(timezone.utc)
        asha_records = []
        phc_records = []

        for index, entry in enumerate(MAHARASHTRA_DISTRICT_DATA, start=1):
            district = entry["district"]
            phc_name = entry["phc"]["name"]
            block = entry["villages"][0][1]
            first = ASHA_FIRST_NAMES[(index - 1) % len(ASHA_FIRST_NAMES)]
            last = ASHA_LAST_NAMES[(index - 1) % len(ASHA_LAST_NAMES)]
            asha_records.append((
                f"990000{index:04d}", f"{first} {last}", "asha", block, district, "Maharashtra", now,
            ))

            for role_index, (role, base_name) in enumerate(PHC_ROLES, start=1):
                phc_records.append((
                    f"PHC-MH-{index:02d}-{role_index:02d}",
                    f"980000{(index * 10) + role_index:04d}",
                    f"{base_name} ({district})", role, phc_name, block, district, "Maharashtra", now,
                ))

        await conn.executemany("""
            INSERT INTO public.asha_workers (phone_number, full_name, role, block, district, state, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (phone_number) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                block = EXCLUDED.block,
                district = EXCLUDED.district,
                state = EXCLUDED.state
        """, asha_records)

        await conn.executemany("""
            INSERT INTO public.phc_workers (
                employee_code, phone_number, full_name, role, phc_name, block, district, state, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (employee_code) DO UPDATE SET
                phone_number = EXCLUDED.phone_number,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                phc_name = EXCLUDED.phc_name,
                block = EXCLUDED.block,
                district = EXCLUDED.district,
                state = EXCLUDED.state,
                is_active = true,
                updated_at = EXCLUDED.updated_at
        """, phc_records)

        asha_count = await conn.fetchval("SELECT COUNT(*) FROM public.asha_workers")
        phc_count = await conn.fetchval("SELECT COUNT(*) FROM public.phc_workers")
        print(f"Upserted {len(asha_records)} ASHA workers and {len(phc_records)} PHC workers.")
        print(f"Directory totals: asha_workers={asha_count}, phc_workers={phc_count}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate_and_seed_workers())
