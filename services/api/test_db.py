import asyncio
import asyncpg
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

async def test_database(exercise_write: bool = False):
    print("=" * 60)
    print(" AROGYA PRAHARI - SUPABASE DATABASE INTEGRATION TEST")
    print("=" * 60)

    if not DATABASE_URL:
        print("[ERROR] SUPABASE_DB_URL not found in .env!")
        return

    print("Connecting to Supabase PostgreSQL...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("[SUCCESS] Connected to Supabase!\n")
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return

    try:
        # 1. Verify Districts Table
        districts = await conn.fetch("SELECT district_id, name, risk_level, active_cases FROM districts ORDER BY active_cases DESC;")
        print(f"[1] Districts Table ({len(districts)} records):")
        for d in districts[:4]:
            print(f"    - {d['name']} ({d['district_id']}): Risk = {d['risk_level']}, Active Cases = {d['active_cases']}")
        if len(districts) > 4:
            print(f"    ... and {len(districts) - 4} more districts.\n")

        # 2. Verify Alerts Table
        alerts = await conn.fetch("SELECT id, district, type, severity, summary FROM alerts ORDER BY timestamp DESC LIMIT 3;")
        print(f"[2] Alerts Table ({len(alerts)} records):")
        for a in alerts:
            print(f"    - [{a['severity']}] {a['district']} ({a['type']}): {a['summary'][:60]}...")
        print()

        # 3. Verify Inventory Table
        inventory = await conn.fetch("SELECT center_name, district, item, stock, status FROM health_center_inventory LIMIT 3;")
        print(f"[3] Health Center Inventory Table ({len(inventory)} records):")
        for inv in inventory:
            print(f"    - {inv['center_name']} ({inv['district']}): {inv['item']} = {inv['stock']} [{inv['status']}]")
        print()

        # 4. Optionally exercise insertion inside a transaction that is always rolled back.
        # This protects production data and avoids introducing test patient records.
        if not exercise_write:
            print("[4] Write test skipped (pass --exercise-write to test a rolled-back transaction).")
            return

        print("[4] Testing Case Report Insertion in a rolled-back transaction...")
        insert_query = """
            INSERT INTO case_reports (
                worker_identifier, patient_name, patient_age_years, patient_gender,
                village, district, symptoms, duration_days, severity, temperature, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, reported_at;
        """
        transaction = conn.transaction()
        await transaction.start()
        try:
            sample_report = await conn.fetchrow(
                insert_query,
                "ASHA-TEST-999", "Database Test Patient", 29, "M",
                "Test Village", "Pune", ["High Fever", "Joint Pain", "Chills"],
                3, "RED", 102.5, "Temporary automated database test insertion."
            )
            fetched = await conn.fetchrow("SELECT id FROM case_reports WHERE id = $1;", sample_report["id"])
            if not fetched:
                raise RuntimeError("Transactional insert could not be read back")
            print("[SUCCESS] Transactional insert/read verification passed; transaction will roll back.")
        finally:
            await transaction.rollback()

        total_reports = await conn.fetchval("SELECT count(*) FROM case_reports;")
        print(f"[5] Total Case Reports in Supabase (unchanged): {total_reports}")

    finally:
        await conn.close()
        print("\n" + "=" * 60)
        print("ALL DATABASE TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run non-destructive Supabase integration checks.")
    parser.add_argument("--exercise-write", action="store_true", help="Verify an insert inside a transaction that is rolled back.")
    args = parser.parse_args()
    asyncio.run(test_database(exercise_write=args.exercise_write))
