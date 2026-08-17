import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")

async def setup_database():
    if not DATABASE_URL:
        print("Error: SUPABASE_DB_URL is not set in environment or .env file.")
        print("Please configure SUPABASE_DB_URL before running setup_db.py")
        return

    print(f"Connecting to database...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return
    
    schema = """
    -- 1. ASHA Workers Table
    create table if not exists asha_workers (
        id uuid primary key default gen_random_uuid(),
        phone_number text unique not null,
        full_name text,
        role text not null check (role in ('asha','anm','phc_supervisor')),
        block text,
        district text,
        state text default 'Maharashtra',
        created_at timestamptz not null default now()
    );

    -- 2. Districts Table
    create table if not exists districts (
        district_id text primary key,
        name text not null,
        state text not null,
        centroid_lat double precision,
        centroid_lng double precision,
        risk_level text default 'LOW',
        risk_score double precision default 0.2,
        active_cases int default 0,
        trend_7d text default 'FLAT',
        trend_pct double precision default 0.0,
        primary_suspected text default 'None',
        population text default '1,000,000',
        asha_active_count int default 50,
        rainfall_mm double precision default 0.0,
        humidity_pct double precision default 60.0,
        last_reported text default 'Recently',
        neighbor_district_ids text[]
    );

    -- Ensure all columns exist if table was previously created with fewer columns
    alter table districts add column if not exists risk_level text default 'LOW';
    alter table districts add column if not exists risk_score double precision default 0.2;
    alter table districts add column if not exists active_cases int default 0;
    alter table districts add column if not exists trend_7d text default 'FLAT';
    alter table districts add column if not exists trend_pct double precision default 0.0;
    alter table districts add column if not exists primary_suspected text default 'None';
    alter table districts add column if not exists population text default '1,000,000';
    alter table districts add column if not exists asha_active_count int default 50;
    alter table districts add column if not exists rainfall_mm double precision default 0.0;
    alter table districts add column if not exists humidity_pct double precision default 60.0;
    alter table districts add column if not exists last_reported text default 'Recently';

    -- 3. Case Reports Table
    create table if not exists case_reports (
        id uuid primary key default gen_random_uuid(),
        asha_worker_id uuid references asha_workers(id),
        worker_identifier text,
        patient_name text,
        patient_age_years int,
        patient_gender text,
        village text,
        block text,
        district text not null,
        state text not null default 'Maharashtra',

        latitude double precision,
        longitude double precision,
        altitude double precision,
        accuracy_meters double precision,
        location_source text default 'gps_auto',
        manual_reason_code text,

        symptoms text[],
        duration_days int default 1,
        temperature double precision,
        temperature_unit text default 'C',
        comorbidities text[],
        medication_taken text,
        suspected_disease text,
        severity text,
        onset_date date,
        reported_at timestamptz not null default now(),
        notes text,
        notes_language text,
        image_urls text[],
        status text default 'reported',
        sync_status text default 'ONLINE',
        created_at timestamptz not null default now()
    );

    -- Ensure case_reports columns exist and have proper defaults if table was created previously
    alter table case_reports alter column id set default gen_random_uuid();
    alter table case_reports alter column state set default 'Maharashtra';
    alter table case_reports alter column asha_worker_id drop not null;
    alter table case_reports alter column location_source set default 'gps_auto';
    alter table case_reports drop constraint if exists case_reports_patient_gender_check;
    alter table case_reports drop constraint if exists case_reports_severity_check;
    alter table case_reports drop constraint if exists case_reports_status_check;
    alter table case_reports add column if not exists worker_identifier text;
    alter table case_reports add column if not exists patient_name text;
    alter table case_reports add column if not exists duration_days int default 1;
    alter table case_reports add column if not exists temperature double precision;
    alter table case_reports add column if not exists temperature_unit text default 'C';
    alter table case_reports add column if not exists comorbidities text[];
    alter table case_reports add column if not exists medication_taken text;
    alter table case_reports add column if not exists sync_status text default 'ONLINE';

    -- 4. Alerts Registry Table
    create table if not exists alerts (
        id text primary key,
        district text not null,
        state text not null default 'Maharashtra',
        type text not null,
        severity text not null check (severity in ('LOW','MODERATE','HIGH','CRITICAL')),
        risk_score double precision not null,
        cases_count int not null,
        worker_role text,
        timestamp timestamptz not null default now(),
        summary text not null,
        status text not null check (status in ('UNACKNOWLEDGED','INVESTIGATING','ACKNOWLEDGED','RESOLVED')) default 'UNACKNOWLEDGED',
        created_at timestamptz not null default now()
    );

    -- 5. PHC & Health Center Supplies / Inventory
    create table if not exists health_center_inventory (
        id serial primary key,
        center_name text not null,
        district text not null,
        item text not null,
        stock int not null default 0,
        status text not null check (status in ('HEALTHY','LOW_STOCK','CRITICAL')),
        bed_capacity int default 0,
        on_duty_doctors int default 0,
        latitude double precision,
        longitude double precision,
        updated_at timestamptz not null default now()
    );

    -- Indexes for high-frequency queries
    create index if not exists idx_case_reports_district on case_reports(district);
    create index if not exists idx_case_reports_reported_at on case_reports(reported_at desc);
    create index if not exists idx_alerts_timestamp on alerts(timestamp desc);
    create index if not exists idx_inventory_district on health_center_inventory(district);
    """
    
    print("Executing schema creation...")
    await conn.execute(schema)
    print("Base schema created successfully!")

    print("Checking seed data for districts...")
    count = await conn.fetchval("SELECT count(*) FROM districts;")
    if count == 0:
        print("Seeding initial Maharashtra districts...")
        seed_districts = """
        INSERT INTO districts (district_id, name, state, centroid_lat, centroid_lng, risk_level, risk_score, active_cases, trend_7d, trend_pct, primary_suspected, population, asha_active_count, rainfall_mm, humidity_pct, last_reported) VALUES
        ('MH-PUN', 'Pune', 'Maharashtra', 18.5204, 73.8567, 'CRITICAL', 0.89, 48, 'UP', 34.5, 'Cholera / Acute Diarrhea', '9,429,408', 142, 88.4, 84, '12 mins ago'),
        ('MH-NSK', 'Nashik', 'Maharashtra', 19.9975, 73.7898, 'HIGH', 0.76, 32, 'UP', 21.0, 'Dengue', '6,107,187', 98, 112.0, 89, '35 mins ago'),
        ('MH-THA', 'Thane', 'Maharashtra', 19.2183, 72.9781, 'HIGH', 0.72, 29, 'UP', 18.2, 'Malaria', '11,060,148', 184, 64.2, 81, '1 hour ago'),
        ('MH-KOP', 'Kolhapur', 'Maharashtra', 16.7050, 74.2433, 'MODERATE', 0.54, 17, 'FLAT', 1.5, 'Viral Fever', '3,876,001', 76, 45.0, 72, '2 hours ago'),
        ('MH-AUR', 'Chhatrapati Sambhajinagar', 'Maharashtra', 19.8762, 75.3433, 'MODERATE', 0.48, 14, 'DOWN', -8.4, 'ARI / Flu', '3,701,282', 82, 22.1, 65, '3 hours ago'),
        ('MH-NAG', 'Nagpur', 'Maharashtra', 21.1458, 79.0882, 'LOW', 0.22, 6, 'DOWN', -15.0, 'Seasonal', '4,653,570', 110, 12.0, 58, '4 hours ago'),
        ('MH-MUM', 'Mumbai Suburban', 'Maharashtra', 19.0760, 72.8777, 'LOW', 0.28, 11, 'FLAT', -2.0, 'Dengue', '12,442,373', 230, 38.0, 79, '30 mins ago'),
        ('MH-SAT', 'Satara', 'Maharashtra', 17.6805, 73.9997, 'LOW', 0.18, 4, 'DOWN', -22.0, 'None', '3,003,741', 64, 18.5, 60, '5 hours ago')
        ON CONFLICT (district_id) DO NOTHING;
        """
        await conn.execute(seed_districts)
        print("Districts seeded successfully.")

    alert_count = await conn.fetchval("SELECT count(*) FROM alerts;")
    if alert_count == 0:
        print("Seeding initial alerts...")
        seed_alerts = """
        INSERT INTO alerts (id, district, state, type, severity, risk_score, cases_count, worker_role, summary, status) VALUES
        ('alt-01', 'Pune', 'Maharashtra', 'SOS_TRIGGER', 'CRITICAL', 0.89, 18, 'ASHA Lead (Haveli Block)', 'URGENT: Cluster of 18 severe diarrhea and acute dehydration cases reported within 6 hours. High risk of localized Cholera outbreak. Immediate IV fluids and isolation protocol required.', 'UNACKNOWLEDGED'),
        ('alt-02', 'Nashik', 'Maharashtra', 'ML_SPIKE_PREDICTION', 'HIGH', 0.76, 12, 'ANM Supervisor (Trimbak)', 'SPATIAL ANOMALY: Dengue incidence increased 42% over baseline following heavy rainfall (112mm). Vector transmission rate accelerating across 3 adjacent sub-centers.', 'INVESTIGATING'),
        ('alt-03', 'Thane', 'Maharashtra', 'ML_SPIKE_PREDICTION', 'HIGH', 0.72, 14, 'PHC Officer (Bhiwandi)', 'THRESHOLD EXCEEDED: Malaria positive test strip confirmations crossed the 95th percentile trigger. Deploy additional rapid diagnostic kits.', 'ACKNOWLEDGED'),
        ('alt-04', 'Kolhapur', 'Maharashtra', 'SOS_TRIGGER', 'MODERATE', 0.54, 7, 'ASHA Worker (Karvir)', 'EARLY WARNING: 7 suspected viral fever cases with joint pain reported. ASHA workers deployed for active house-to-house screening.', 'RESOLVED')
        ON CONFLICT (id) DO NOTHING;
        """
        await conn.execute(seed_alerts)
        print("Alerts seeded successfully.")

    inv_count = await conn.fetchval("SELECT count(*) FROM health_center_inventory;")
    if inv_count == 0:
        print("Seeding initial health center inventory...")
        seed_inv = """
        INSERT INTO health_center_inventory (center_name, district, item, stock, status, bed_capacity, on_duty_doctors, latitude, longitude) VALUES
        ('Haveli PHC', 'Pune', 'ORS', 45, 'LOW_STOCK', 20, 2, 18.5204, 73.8567),
        ('Haveli PHC', 'Pune', 'IV Ringer''s Lactate', 150, 'HEALTHY', 20, 2, 18.5204, 73.8567),
        ('Haveli PHC', 'Pune', 'Paracetamol', 30, 'CRITICAL', 20, 2, 18.5204, 73.8567),
        ('Trimbak Rural Hospital', 'Nashik', 'Dengue Rapid Test Kits', 15, 'LOW_STOCK', 35, 4, 19.9975, 73.7898),
        ('Bhiwandi Sub-District Hospital', 'Thane', 'Artemether Injections', 80, 'HEALTHY', 60, 6, 19.2183, 72.9781);
        """
        await conn.execute(seed_inv)
        print("Inventory seeded successfully.")

    await conn.close()
    print("Database setup & seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(setup_database())
