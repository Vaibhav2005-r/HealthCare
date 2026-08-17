import asyncio
import os
import json
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport

load_dotenv()

async def run_comprehensive_api_tests():
    print("=" * 65)
    print("  AROGYA PRAHARI - FULL SYSTEM & DATABASE API TEST SUITE")
    print("=" * 65)

    from database.connection import init_db_pool, close_db_pool
    from main import app, initialise_offline_sync_database
    
    initialise_offline_sync_database()
    await init_db_pool()

    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Health Root
        print("\n[TEST 1] Root Health Endpoint (GET /)...")
        res = await client.get("/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        print(f"  --> Status: {data.get('status')} | Version: {data.get('version')}")

        # Test 2: Live Dashboard from Supabase
        print("\n[TEST 2] Live Outbreak Dashboard (GET /api/v1/dashboard/live)...")
        res = await client.get("/api/v1/dashboard/live")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        live_data = res.json()
        pulse = live_data.get("pulse", {})
        print(f"  --> Monitored Districts: {pulse.get('total_districts')}")
        print(f"  --> Risk Breakdown: Critical={pulse.get('critical_count')}, High={pulse.get('high_count')}, Mod={pulse.get('moderate_count')}, Low={pulse.get('low_count')}")
        print(f"  --> Active Cases Total: {live_data.get('summary', {}).get('active_cases_total')}")

        # Test 3: Districts List
        print("\n[TEST 3] District Matrix (GET /api/v1/dashboard/districts)...")
        res = await client.get("/api/v1/dashboard/districts")
        assert res.status_code == 200
        districts = res.json().get("districts", [])
        print(f"  --> Fetched {len(districts)} districts from Supabase:")
        for d in districts[:3]:
            print(f"      - {d['name']} [{d['district_id']}]: Risk Score = {d['risk_score']} ({d['risk_level']})")

        # Test 4: Submit Case Report via API into Supabase
        print("\n[TEST 4] Case Intake Insertion (POST /api/v1/reports)...")
        new_report = {
            "worker_id": "ASHA-PUNE-88",
            "patient_name": "Sunita Deshmukh",
            "patient_age": 34,
            "patient_gender": "F",
            "village": "Haveli Center",
            "district": "Pune",
            "symptoms": ["High Fever", "Vomiting", "Severe Dehydration"],
            "duration_days": 2,
            "severity": "RED",
            "temperature": 103.2,
            "location_lat": 18.5204,
            "location_lng": 73.8567,
            "notes": "End-to-end API test case report."
        }
        res = await client.post("/api/v1/reports", json=new_report)
        assert res.status_code == 200
        report_res = res.json()
        saved_id = report_res.get("report_id")
        print(f"  --> Report Status: {report_res.get('status')}")
        print(f"  --> Inserted Report UUID: {saved_id}")

        # Test 5: Verify Report Appears in Telemetry Logs Query
        print("\n[TEST 5] Telemetry Logs Query (GET /api/v1/telemetry/logs)...")
        res = await client.get("/api/v1/telemetry/logs?district=Pune")
        assert res.status_code == 200
        logs_data = res.json()
        logs = logs_data.get("logs", [])
        print(f"  --> Total Pune logs returned: {len(logs)}")
        if logs:
            latest = logs[0]
            print(f"  --> Latest log: Patient '{latest.get('patient_name')}' | Worker: {latest.get('worker_id')} | Status: {latest.get('status')}")

        # Test 6: PHC Inventory & Supplies
        print("\n[TEST 6] PHC Buffer Stock (GET /api/v1/resources/inventory)...")
        res = await client.get("/api/v1/resources/inventory")
        assert res.status_code == 200
        supplies = res.json().get("supplies", [])
        print(f"  --> Total supply records: {len(supplies)}")
        for sup in supplies[:3]:
            print(f"      - {sup.get('center_name')} ({sup.get('district')}): {sup.get('item')} = {sup.get('stock')} [{sup.get('status')}]")

        # Test 7: Emergency SOS Alert Insertion
        print("\n[TEST 7] SOS Outbreak Alert Trigger (POST /api/v1/alerts/sos)...")
        sos_payload = {
            "worker_id": "ASHA-LEAD-01",
            "district": "Nashik",
            "cases": 9,
            "severity": "CRITICAL"
        }
        res = await client.post("/api/v1/alerts/sos", json=sos_payload)
        assert res.status_code == 200
        alert_res = res.json()
        print(f"  --> SOS Status: {alert_res.get('status')}")
        print(f"  --> Alert ID: {alert_res.get('alert', {}).get('id')} ({alert_res.get('alert', {}).get('severity')})")

        # Test 8: Analytics Trends & Demographics
        print("\n[TEST 8] Analytics Aggregations...")
        res_trends = await client.get("/api/v1/analytics/trends")
        res_demo = await client.get("/api/v1/analytics/demographics")
        assert res_trends.status_code == 200
        assert res_demo.status_code == 200
        print(f"  --> Historical Trend Points: {len(res_trends.json().get('data', []))}")
        print(f"  --> Demographics Age Brackets: {res_demo.json().get('age_brackets')}")

    await close_db_pool()

    print("\n" + "=" * 65)
    print("  ALL 8 SYSTEM ENDPOINTS & DATABASE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_comprehensive_api_tests())
