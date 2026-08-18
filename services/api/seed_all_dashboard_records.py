import os
import asyncio
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import asyncpg

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
DB_URL = os.getenv("SUPABASE_DB_URL")

async def seed_supabase_all():
    print(f"Connecting to Supabase at: {DB_URL[:35]}...")
    conn = await asyncpg.connect(dsn=DB_URL)
    
    try:
        now = datetime.now(timezone.utc)
        
        # 1. SEED ASHA WORKERS
        print("1. Seeding asha_workers...")
        asha_workers = [
            ("9876543210", "Sunita Gaikwad", "asha", "Haveli", "Pune", "Maharashtra"),
            ("9876543211", "Anandi Shinde", "asha", "Trimbak", "Nashik", "Maharashtra"),
            ("9876543212", "Kavita Patil", "phc_supervisor", "Kalyan", "Thane", "Maharashtra"),
            ("9876543213", "Meena Kamble", "asha", "Karveer", "Kolhapur", "Maharashtra"),
            ("9876543214", "Rekha Jadhav", "asha", "Manor", "Palghar", "Maharashtra"),
            ("9876543215", "Pooja Meshram", "asha", "Bhamragad", "Gadchiroli", "Maharashtra"),
            ("9876543216", "Laxmi Rathod", "asha", "Pusad", "Yavatmal", "Maharashtra"),
            ("9876543217", "Savita Deshmukh", "asha", "Biloli", "Nanded", "Maharashtra"),
            ("9876543218", "Shobha Pawar", "asha", "Ballarpur", "Chandrapur", "Maharashtra"),
            ("9876543219", "Dr. S. Kulkarni", "phc_supervisor", "Civil Hospital", "Pune", "Maharashtra"),
        ]
        for phone, name, role, block, dist, state in asha_workers:
            await conn.execute("""
                INSERT INTO public.asha_workers (phone_number, full_name, role, block, district, state, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (phone_number) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    role = EXCLUDED.role,
                    block = EXCLUDED.block,
                    district = EXCLUDED.district,
                    state = EXCLUDED.state
            """, phone, name, role, block, dist, state, now)
        print(f" -> Upserted {len(asha_workers)} asha_workers")

        # 2. SEED VILLAGES
        print("2. Seeding villages...")
        await conn.execute("DELETE FROM public.villages")
        villages = [
            ("Manor Tribal Ward", "Manor", "Palghar", "Maharashtra", 4200, 19.7420, 72.8800),
            ("Wada Village", "Wada", "Palghar", "Maharashtra", 6500, 19.6520, 73.1380),
            ("Hadapsar Rural Colony", "Haveli", "Pune", "Maharashtra", 8900, 18.5089, 73.9259),
            ("Khed Shivapur", "Haveli", "Pune", "Maharashtra", 5400, 18.3540, 73.8470),
            ("Bhamragad Forest Settlement", "Bhamragad", "Gadchiroli", "Maharashtra", 3100, 19.2480, 80.3540),
            ("Allapalli Sector", "Aheri", "Gadchiroli", "Maharashtra", 4800, 19.4200, 80.0600),
            ("Trimbakeshwar Sub-center", "Trimbak", "Nashik", "Maharashtra", 7200, 19.9380, 73.5300),
            ("Igatpuri Hills", "Igatpuri", "Nashik", "Maharashtra", 6100, 19.6970, 73.5600),
            ("Ballarpur Ward 4", "Ballarpur", "Chandrapur", "Maharashtra", 9400, 19.8500, 79.3500),
            ("Bhiwandi Textile Cluster", "Bhiwandi", "Thane", "Maharashtra", 12500, 19.3000, 73.0600),
            ("Karveer Gaon", "Karveer", "Kolhapur", "Maharashtra", 5800, 16.7000, 74.2400),
            ("Biloli Central", "Biloli", "Nanded", "Maharashtra", 4900, 18.7700, 77.7300),
            ("Pusad Rural", "Pusad", "Yavatmal", "Maharashtra", 6800, 19.9100, 77.5800),
            ("Dharashiv Sub-center", "Dharashiv", "Dharashiv", "Maharashtra", 5300, 18.1856, 76.0419),
            ("Ratnagiri Coastal Hamlet", "Ratnagiri", "Ratnagiri", "Maharashtra", 3800, 16.9902, 73.3120),
            ("Gondia East Sector", "Gondia", "Gondia", "Maharashtra", 7100, 21.4624, 80.2210),
            ("Amravati Camp", "Amravati", "Amravati", "Maharashtra", 8200, 20.9374, 77.7796),
            ("Chhatrapati Sambhajinagar North", "Aurangabad", "Chhatrapati Sambhajinagar", "Maharashtra", 11000, 19.8762, 75.3433),
            ("Solapur Textile Nagar", "North Solapur", "Solapur", "Maharashtra", 9600, 17.6599, 75.9064),
        ]
        for vname, block, dist, state, pop, lat, lng in villages:
            await conn.execute("""
                INSERT INTO public.villages (village_name, block, district, state, population, latitude, longitude, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, vname, block, dist, state, pop, lat, lng, now)
        print(f" -> Inserted {len(villages)} villages")

        # 3. SEED ALERTS
        print("3. Seeding alerts...")
        alerts_data = [
            (
                "alt-01",
                "Palghar",
                "Maharashtra",
                "THRESHOLD_BREACH",
                "CRITICAL",
                0.89,
                46,
                "ASHA Lead (Manor Sector)",
                now - timedelta(minutes=45),
                "CLUSTER SPIKE: 46 acute diarrheal and dehydration cases flagged within 48h following 94.5mm rainfall. High risk of waterborne Vibrio cholerae contamination.",
                "UNACKNOWLEDGED",
                None, None, None, None, None, None, now - timedelta(minutes=45)
            ),
            (
                "alt-02",
                "Gadchiroli",
                "Maharashtra",
                "ML_SPIKE_PREDICTION",
                "CRITICAL",
                0.87,
                49,
                "Mobile Medical Unit Lead (Bhamragad)",
                now - timedelta(hours=2, minutes=15),
                "VECTOR SURGE WARNING: Falciparum malaria positivity rate jumped +28.5% across 4 tribal sub-centers. Heavy precipitation (88mm) and stagnant backwaters trigger emergency IRS response.",
                "ACKNOWLEDGED",
                now - timedelta(hours=1, minutes=30), "Dr. S. Kulkarni (CMO)", None, None, None, None, now - timedelta(hours=2, minutes=15)
            ),
            (
                "alt-03",
                "Pune",
                "Maharashtra",
                "ML_SPIKE_PREDICTION",
                "CRITICAL",
                0.84,
                52,
                "Medical Officer (Haveli PHC)",
                now - timedelta(hours=3, minutes=40),
                "WATERBORNE ALERT: 52 suspected gastroenteritis/cholera cases reported in peri-urban slums. Chlorine dosing recommended immediately.",
                "INVESTIGATING",
                now - timedelta(hours=3), "Dr. S. Kulkarni (CMO)", None, None, None, None, now - timedelta(hours=3, minutes=40)
            ),
            (
                "alt-04",
                "Chandrapur",
                "Maharashtra",
                "THRESHOLD_BREACH",
                "CRITICAL",
                0.82,
                41,
                "ANM Supervisor (Ballarpur)",
                now - timedelta(hours=5),
                "WATER TURBIDITY TRIGGER: High fecal coliform detected in municipal inlet pipeline. 41 active diarrhea cases admitted in 24 hours.",
                "UNACKNOWLEDGED",
                None, None, None, None, None, None, now - timedelta(hours=5)
            ),
            (
                "alt-05",
                "Nanded",
                "Maharashtra",
                "SOS_TRIGGER",
                "HIGH",
                0.81,
                44,
                "ASHA Lead (Biloli)",
                now - timedelta(hours=8),
                "OUTBREAK DETECTED: 44 cases of acute watery diarrhea in Biloli block following localized inundation. ORS buffer stock depleted.",
                "ACKNOWLEDGED",
                now - timedelta(hours=7), "Dr. S. Kulkarni (CMO)", None, None, None, None, now - timedelta(hours=8)
            ),
            (
                "alt-06",
                "Nashik",
                "Maharashtra",
                "ML_SPIKE_PREDICTION",
                "HIGH",
                0.76,
                36,
                "ANM Supervisor (Trimbak)",
                now - timedelta(hours=12),
                "SPATIAL ANOMALY: Dengue incidence increased +42% over baseline following heavy rainfall (62mm). Vector transmission rate accelerating across 3 adjacent sub-centers.",
                "INVESTIGATING",
                now - timedelta(hours=10), "Dr. S. Kulkarni (CMO)", None, None, None, None, now - timedelta(hours=12)
            ),
            (
                "alt-07",
                "Yavatmal",
                "Maharashtra",
                "THRESHOLD_BREACH",
                "HIGH",
                0.74,
                33,
                "PHC Officer (Pusad)",
                now - timedelta(hours=16),
                "SCRUB TYPHUS CLUSTER: 33 suspected cases with eschar marks and fever reported in farming community. Doxycycline prophylaxis initiated.",
                "ACKNOWLEDGED",
                now - timedelta(hours=14), "Dr. S. Kulkarni (CMO)", None, None, None, None, now - timedelta(hours=16)
            ),
            (
                "alt-08",
                "Kolhapur",
                "Maharashtra",
                "SOS_TRIGGER",
                "MODERATE",
                0.54,
                21,
                "ASHA Worker (Karveer)",
                now - timedelta(days=1),
                "EARLY WARNING: 21 suspected viral fever and chikungunya cases with joint stiffness reported. Active house-to-house screening completed.",
                "RESOLVED",
                now - timedelta(days=1), "Dr. S. Kulkarni (CMO)", now - timedelta(hours=18), "Dr. S. Kulkarni (CMO)", "Chief Medical Officer / DHO", "Active fogging completed and fever clinic established. All 21 patients recovering.", now - timedelta(days=1)
            ),
        ]
        
        for (aid, dist, st, atype, sev, rscore, cases, wrole, ts, summ, status, ack_at, ack_by, res_at, res_by, res_role, res_notes, cat) in alerts_data:
            await conn.execute("""
                INSERT INTO public.alerts (
                    id, district, state, type, severity, risk_score, cases_count, worker_role, timestamp, summary, status,
                    acknowledged_at, acknowledged_by, resolved_at, resolved_by, resolved_by_role, resolution_notes, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                ON CONFLICT (id) DO UPDATE SET
                    district = EXCLUDED.district,
                    type = EXCLUDED.type,
                    severity = EXCLUDED.severity,
                    risk_score = EXCLUDED.risk_score,
                    cases_count = EXCLUDED.cases_count,
                    worker_role = EXCLUDED.worker_role,
                    timestamp = EXCLUDED.timestamp,
                    summary = EXCLUDED.summary,
                    status = EXCLUDED.status,
                    acknowledged_at = EXCLUDED.acknowledged_at,
                    acknowledged_by = EXCLUDED.acknowledged_by,
                    resolved_at = EXCLUDED.resolved_at,
                    resolved_by = EXCLUDED.resolved_by,
                    resolved_by_role = EXCLUDED.resolved_by_role,
                    resolution_notes = EXCLUDED.resolution_notes
            """, aid, dist, st, atype, sev, rscore, cases, wrole, ts, summ, status, ack_at, ack_by, res_at, res_by, res_role, res_notes, cat)
        print(f" -> Upserted {len(alerts_data)} alerts")

        # 4. SEED ALERT AUDIT LOGS
        print("4. Seeding alert_audit_logs...")
        await conn.execute("DELETE FROM public.alert_audit_logs")
        audit_logs = [
            ("alt-01", "UNACKNOWLEDGED", "INVESTIGATING", "Dr. S. Kulkarni (CMO)", "Chief Medical Officer / DHO", "Rapid Response Team (RRT) dispatched with 200 IV Ringer Lactate & 500 ORS sachets to Manor PHC.", now - timedelta(minutes=30)),
            ("alt-02", "UNACKNOWLEDGED", "ACKNOWLEDGED", "Dr. S. Kulkarni (CMO)", "Chief Medical Officer / DHO", "Acknowledged. Ordered immediate indoor residual spraying (IRS) with synthetic pyrethroids in Bhamragad sector.", now - timedelta(hours=1, minutes=30)),
            ("alt-03", "ACKNOWLEDGED", "INVESTIGATING", "Dr. S. Kulkarni (CMO)", "Chief Medical Officer / DHO", "Water quality testing team taking pipeline samples across 6 municipal wards in Haveli.", now - timedelta(hours=3)),
            ("alt-05", "UNACKNOWLEDGED", "ACKNOWLEDGED", "Dr. S. Kulkarni (CMO)", "Chief Medical Officer / DHO", "Emergency ORS buffer stock re-routed from Nanded Civil Hospital to Biloli PHC.", now - timedelta(hours=7)),
            ("alt-08", "INVESTIGATING", "RESOLVED", "Dr. S. Kulkarni (CMO)", "Chief Medical Officer / DHO", "Active fogging completed and fever clinic established. All 21 patients recovering.", now - timedelta(hours=18)),
        ]
        for aid, prev_s, new_s, aby, arole, anotes, cat in audit_logs:
            await conn.execute("""
                INSERT INTO public.alert_audit_logs (alert_id, previous_status, new_status, action_by, action_role, action_notes, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, aid, prev_s, new_s, aby, arole, anotes, cat)
        print(f" -> Inserted {len(audit_logs)} alert audit logs")

        # 5. SEED HEALTH CENTER INVENTORY
        print("5. Seeding health_center_inventory...")
        await conn.execute("DELETE FROM public.health_center_inventory")
        
        inventory_items = [
            # Palghar
            ("Manor Tribal Primary Health Center", "Palghar", "ORS Sachets (1 Litre Packets)", 65, "CRITICAL", 20, 2, 19.7420, 72.8800),
            ("Manor Tribal Primary Health Center", "Palghar", "IV Ringer Lactate (500ml)", 18, "CRITICAL", 20, 2, 19.7420, 72.8800),
            ("Manor Tribal Primary Health Center", "Palghar", "Chlorine Water Purification Tablets", 120, "LOW_STOCK", 20, 2, 19.7420, 72.8800),
            ("Manor Tribal Primary Health Center", "Palghar", "Zinc Sulfate Tablets (20mg)", 85, "HEALTHY", 20, 2, 19.7420, 72.8800),
            
            # Gadchiroli
            ("Bhamragad Sub-District Hospital", "Gadchiroli", "Artemisinin-based (ACT-SP) Combipacks", 35, "CRITICAL", 30, 3, 19.2480, 80.3540),
            ("Bhamragad Sub-District Hospital", "Gadchiroli", "Bivalent Malaria RDT Kits (Pf/Pv)", 42, "LOW_STOCK", 30, 3, 19.2480, 80.3540),
            ("Bhamragad Sub-District Hospital", "Gadchiroli", "Injectable Artesunate Vials", 14, "CRITICAL", 30, 3, 19.2480, 80.3540),
            ("Bhamragad Sub-District Hospital", "Gadchiroli", "Paracetamol 500mg Tablets", 450, "HEALTHY", 30, 3, 19.2480, 80.3540),

            # Pune
            ("Haveli Primary Health Center", "Pune", "ORS Sachets (1 Litre Packets)", 180, "HEALTHY", 25, 3, 18.5089, 73.9259),
            ("Haveli Primary Health Center", "Pune", "Dengue NS1 Antigen Test Kits", 24, "LOW_STOCK", 25, 3, 18.5089, 73.9259),
            ("Haveli Primary Health Center", "Pune", "Paracetamol 650mg Blister Packs", 30, "CRITICAL", 25, 3, 18.5089, 73.9259),
            ("Haveli Primary Health Center", "Pune", "IV Infusion Sets & Cannulas", 55, "HEALTHY", 25, 3, 18.5089, 73.9259),

            # Nashik
            ("Trimbak Rural Hospital", "Nashik", "Dengue Rapid Test Kits (NS1/IgM)", 15, "LOW_STOCK", 35, 4, 19.9380, 73.5300),
            ("Trimbak Rural Hospital", "Nashik", "Paracetamol Suspension (Pediatric)", 40, "LOW_STOCK", 35, 4, 19.9380, 73.5300),
            ("Trimbak Rural Hospital", "Nashik", "ORS Sachets", 320, "HEALTHY", 35, 4, 19.9380, 73.5300),
            ("Trimbak Rural Hospital", "Nashik", "Synthetic Pyrethroid Fogging Emulsion (Ltr)", 12, "CRITICAL", 35, 4, 19.9380, 73.5300),

            # Chandrapur
            ("Ballarpur Community Health Center", "Chandrapur", "Chlorine Bleaching Powder (25kg Bags)", 8, "CRITICAL", 28, 3, 19.8500, 79.3500),
            ("Ballarpur Community Health Center", "Chandrapur", "IV Ringer Lactate & Dextrose", 45, "LOW_STOCK", 28, 3, 19.8500, 79.3500),
            ("Ballarpur Community Health Center", "Chandrapur", "Ciprofloxacin 500mg Tablets", 110, "HEALTHY", 28, 3, 19.8500, 79.3500),

            # Nanded
            ("Biloli Primary Health Center", "Nanded", "ORS Electrolyte Packets", 38, "CRITICAL", 20, 2, 18.7700, 77.7300),
            ("Biloli Primary Health Center", "Nanded", "Metronidazole 400mg Tablets", 90, "HEALTHY", 20, 2, 18.7700, 77.7300),
            ("Biloli Primary Health Center", "Nanded", "Water Chlorine Test Halometer Strips", 20, "LOW_STOCK", 20, 2, 18.7700, 77.7300),

            # Yavatmal
            ("Pusad Sub-District Hospital", "Yavatmal", "Doxycycline 100mg Capsules", 25, "CRITICAL", 40, 4, 19.9100, 77.5800),
            ("Pusad Sub-District Hospital", "Yavatmal", "Scrub Typhus Rapid Antibody Kits", 18, "LOW_STOCK", 40, 4, 19.9100, 77.5800),
            ("Pusad Sub-District Hospital", "Yavatmal", "Azithromycin 500mg Tablets", 140, "HEALTHY", 40, 4, 19.9100, 77.5800),

            # Kolhapur
            ("Karveer Rural Hospital", "Kolhapur", "Paracetamol 500mg Tablets", 380, "HEALTHY", 30, 3, 16.7000, 74.2400),
            ("Karveer Rural Hospital", "Kolhapur", "Chikungunya IgM Elisa Strips", 30, "LOW_STOCK", 30, 3, 16.7000, 74.2400),
            ("Karveer Rural Hospital", "Kolhapur", "Insecticide Treated Bed Nets (ITBN)", 60, "HEALTHY", 30, 3, 16.7000, 74.2400),
        ]
        for cname, dist, item, stock, st, beds, docs, lat, lng in inventory_items:
            await conn.execute("""
                INSERT INTO public.health_center_inventory (
                    center_name, district, item, stock, status, bed_capacity, on_duty_doctors, latitude, longitude, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """, cname, dist, item, stock, st, beds, docs, lat, lng, now)
        print(f" -> Inserted {len(inventory_items)} health center inventory records")

        # 6. SEED CASE REPORTS (Field Telemetry)
        print("6. Seeding case_reports...")
        await conn.execute("DELETE FROM public.case_reports")

        case_reports = [
            ("9876543214", "Rameshwar Kokane", 38, "M", "Manor Tribal Ward", "Manor", "Palghar", "Maharashtra", 19.7420, 72.8800, 12.5, "GPS_VERIFIED", ["Severe watery diarrhea", "Vomiting", "Severe dehydration", "Rapid pulse"], "Cholera / Acute Diarrhea", ["Hypertension"], "None", "RED", 100.4, "F", 2, "gps_auto", "Patient severely dehydrated. Administered 1L ORS and referred immediately to Manor PHC.", "SYNCED_SUPABASE", now - timedelta(minutes=15)),
            ("9876543214", "Sakubai Dhangar", 45, "F", "Manor Tribal Ward", "Manor", "Palghar", "Maharashtra", 19.7435, 72.8812, 10.0, "GPS_VERIFIED", ["Rice-water stool", "Muscle cramps", "Lethargy"], "Cholera / Acute Diarrhea", [], "ORS Sachet", "RED", 99.8, "F", 1, "gps_auto", "Second case in same household. Well water suspected source.", "SYNCED_SUPABASE", now - timedelta(minutes=28)),
            ("9876543215", "Madhavi Madavi", 26, "F", "Bhamragad Forest Settlement", "Bhamragad", "Gadchiroli", "Maharashtra", 19.2480, 80.3540, 15.0, "GPS_VERIFIED", ["High fever with chills", "Profuse sweating", "Severe headache", "Jaundice"], "Falciparum Malaria", [], "Paracetamol", "RED", 103.2, "F", 3, "gps_auto", "Bivalent RDT positive for Pf Malaria. Started ACT-SP dose 1.", "SYNCED_SUPABASE", now - timedelta(hours=1, minutes=10)),
            ("9876543210", "Aarav Deshmukh", 11, "M", "Hadapsar Rural Colony", "Haveli", "Pune", "Maharashtra", 18.5089, 73.9259, 8.0, "GPS_VERIFIED", ["High fever", "Retro-orbital pain", "Joint aches", "Petechial rash"], "Dengue Fever", [], "Paracetamol suspension", "AMBER", 102.5, "F", 4, "gps_auto", "NS1 antigen positive. Strict oral hydration advised. Platelet monitor scheduled.", "SYNCED_SUPABASE", now - timedelta(hours=2, minutes=5)),
            ("9876543211", "Kishor Sonawane", 32, "M", "Trimbakeshwar Sub-center", "Trimbak", "Nashik", "Maharashtra", 19.9380, 73.5300, 14.0, "GPS_VERIFIED", ["Continuous fever", "Severe bodyache", "Nausea", "Loss of appetite"], "Dengue Fever", [], "Paracetamol", "AMBER", 101.8, "F", 3, "gps_auto", "Multiple stagnant puddles outside house. Mosquito breeding checked.", "SYNCED_SUPABASE", now - timedelta(hours=3, minutes=15)),
            ("9876543216", "Gangadhar Rathod", 52, "M", "Pusad Rural", "Pusad", "Yavatmal", "Maharashtra", 19.9100, 77.5800, 18.0, "GPS_VERIFIED", ["High fever", "Black crust eschar on groin", "Lymphadenopathy", "Headache"], "Scrub Typhus", ["Diabetes"], "Doxycycline", "AMBER", 102.8, "F", 5, "gps_auto", "Classic cigarette burn eschar mark identified. Doxycycline 100mg BD initiated.", "SYNCED_SUPABASE", now - timedelta(hours=4, minutes=45)),
            ("9876543218", "Tukaram Wankhede", 60, "M", "Ballarpur Ward 4", "Ballarpur", "Chandrapur", "Maharashtra", 19.8500, 79.3500, 11.0, "GPS_VERIFIED", ["Acute loose stools", "Abdominal cramps", "Mild fever"], "Acute Gastroenteritis", ["Hypertension"], "ORS", "AMBER", 100.2, "F", 2, "gps_auto", "Provided 4 ORS packets and water purification tablets.", "SYNCED_SUPABASE", now - timedelta(hours=6)),
            ("9876543212", "Sunita Shinde", 29, "F", "Bhiwandi Textile Cluster", "Bhiwandi", "Thane", "Maharashtra", 19.3000, 73.0600, 9.5, "GPS_VERIFIED", ["Fever with rigors", "Sweating", "Fatigue"], "Vivax Malaria", [], "Chloroquine", "AMBER", 101.5, "F", 2, "gps_auto", "Pv positive on RDT. Initiated standard chloroquine course.", "SYNCED_SUPABASE", now - timedelta(hours=7, minutes=20)),
            ("9876543213", "Dnyaneshwar Patil", 22, "M", "Karveer Gaon", "Karveer", "Kolhapur", "Maharashtra", 16.7000, 74.2400, 16.0, "GPS_VERIFIED", ["Fever", "Severe bilateral wrist and ankle pain", "Rash"], "Chikungunya", [], "Paracetamol", "GREEN", 100.6, "F", 3, "gps_auto", "Supportive rest and hydration advised.", "SYNCED_SUPABASE", now - timedelta(hours=9)),
            ("9876543217", "Gopalrao Kadam", 41, "M", "Biloli Central", "Biloli", "Nanded", "Maharashtra", 18.7700, 77.7300, 12.0, "GPS_VERIFIED", ["Watery diarrhea", "Vomiting", "Thirst"], "Cholera / Acute Diarrhea", [], "ORS", "RED", 100.0, "F", 1, "gps_auto", "Referred to Biloli PHC for IV fluid assessment.", "SYNCED_SUPABASE", now - timedelta(hours=11)),
        ]
        
        for w_id, pname, page, pgen, vill, blk, dst, st, lat, lng, acc, m_code, syms, susp, comorb, meds, sev, temp, t_unit, dur, l_src, notes, s_stat, r_at in case_reports:
            await conn.execute("""
                INSERT INTO public.case_reports (
                    worker_identifier, patient_name, patient_age_years, patient_gender, village, block, district, state,
                    latitude, longitude, accuracy_meters, manual_reason_code, symptoms, suspected_disease,
                    comorbidities, medication_taken, severity, temperature, temperature_unit, duration_days,
                    location_source, notes, sync_status, reported_at, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            """, w_id, pname, page, pgen, vill, blk, dst, st, lat, lng, acc, m_code, syms, susp, comorb, meds, sev, temp, t_unit, dur, l_src, notes, s_stat, r_at, r_at)
        print(f" -> Inserted {len(case_reports)} case_reports")

        print("ALL SUPABASE DATABASE TABLES POPULATED & SYNCHRONIZED SUCCESSFULLY!")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_supabase_all())
