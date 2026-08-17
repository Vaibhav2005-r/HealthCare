import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")

async def setup_database():
    print(f"Connecting to {DATABASE_URL}...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    schema = """
    create table if not exists asha_workers (
        id uuid primary key default gen_random_uuid(),
        phone_number text unique not null,
        full_name text,
        role text not null check (role in ('asha','anm','phc_supervisor')),
        block text,
        district text,
        state text,
        created_at timestamptz not null default now()
    );

    create table if not exists case_reports (
        id uuid primary key,
        asha_worker_id uuid not null references asha_workers(id),
        patient_age_years int,
        patient_gender text check (patient_gender in ('male','female','other')),
        village text,
        block text,
        district text not null,
        state text not null,

        latitude double precision,
        longitude double precision,
        altitude double precision,
        accuracy_meters double precision,
        location_source text not null check (location_source in ('gps_auto','manual_fallback')),
        manual_reason_code text,

        symptoms text[],
        suspected_disease text,
        severity text check (severity in ('mild','moderate','severe')),
        onset_date date,
        reported_at timestamptz not null default now(),
        notes text,
        notes_language text,
        image_urls text[],
        status text check (status in ('reported','verified','confirmed','recovered','deceased')),
        verified_by uuid references asha_workers(id),
        created_at timestamptz not null default now()
    );

    create table if not exists districts (
        district_id text primary key,
        name text not null,
        state text not null,
        centroid_lat double precision,
        centroid_lng double precision,
        neighbor_district_ids text[]
    );
    """
    
    print("Executing schema creation...")
    await conn.execute(schema)
    print("Schema created successfully!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(setup_database())
