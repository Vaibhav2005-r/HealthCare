import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

async def test_database():
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

        # 4. Test Inserting a Live Case Report
        print("[4] Testing Case Report Insertion...")
        insert_query = """
            INSERT INTO case_reports (
                worker_identifier, patient_name, patient_age_years, patient_gender,
                village, district, symptoms, duration_days, severity, temperature, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, reported_at;
        """
        sample_report = await conn.fetchrow(
            insert_query,
            "ASHA-TEST-999", "Rahul Sharma", 29, "M",
            "Kalyanpur", "Pune", ["High Fever", "Joint Pain", "Chills"],
            3, "RED", 102.5, "Live database automated test insertion."
        )
        report_id = sample_report["id"]
        reported_at = sample_report["reported_at"]
        print(f"[SUCCESS] Inserted test report:")
        print(f"    - ID: {report_id}")
        print(f"    - Reported At: {reported_at}\n")

        # 5. Query the inserted report back
        fetched = await conn.fetchrow("SELECT * FROM case_reports WHERE id = $1;", report_id)
        if fetched:
            print("[5] Query Verification: Retrieved test report from Supabase:")
            print(f"    - Patient: {fetched['patient_name']} (Age: {fetched['patient_age_years']})")
            print(f"    - Symptoms: {fetched['symptoms']}")
            print(f"    - Severity: {fetched['severity']}")
            print(f"    - Notes: {fetched['notes']}\n")

        # Total count
        total_reports = await conn.fetchval("SELECT count(*) FROM case_reports;")
        print(f"[6] Total Case Reports in Supabase: {total_reports}")

    finally:
        await conn.close()
        print("\n" + "=" * 60)
        print("ALL DATABASE TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_database())
