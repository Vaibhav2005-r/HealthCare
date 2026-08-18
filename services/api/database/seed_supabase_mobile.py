import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv('/Users/vaibhav/SIH/services/api/.env')
db_url = os.getenv('SUPABASE_DB_URL')

async def main():
    print(f"Connecting to Supabase at {db_url[:35]}...")
    conn = await asyncpg.connect(db_url)
    
    print("1. Creating public.villages table...")
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS public.villages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            village_name TEXT NOT NULL,
            block TEXT NOT NULL,
            district TEXT NOT NULL,
            state TEXT NOT NULL DEFAULT 'Maharashtra',
            population INTEGER DEFAULT 1200,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)

    print("2. Creating public.clinical_guidance table...")
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS public.clinical_guidance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            condition TEXT NOT NULL,
            category TEXT NOT NULL,
            severity_tier TEXT NOT NULL DEFAULT 'MODERATE',
            trigger_symptoms TEXT[] NOT NULL,
            immediate_action TEXT NOT NULL,
            red_flags TEXT[] NOT NULL,
            standard_dosage TEXT,
            isolation_protocol TEXT,
            source_document TEXT DEFAULT 'IDSP National Guidelines',
            page_number INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)

    # Seed Villages
    villages_data = [
        ('Khed', 'Khed', 'Pune', 'Maharashtra', 3400, 18.8465, 73.9082),
        ('Manchar', 'Ambegaon', 'Pune', 'Maharashtra', 5200, 19.0063, 73.9431),
        ('Junnar', 'Junnar', 'Pune', 'Maharashtra', 7800, 19.2069, 73.8764),
        ('Shirur', 'Shirur', 'Pune', 'Maharashtra', 6100, 18.8277, 74.3789),
        ('Ambegaon', 'Ambegaon', 'Pune', 'Maharashtra', 2900, 19.0200, 73.8500),
        ('Wagholi', 'Haveli', 'Pune', 'Maharashtra', 11000, 18.5793, 73.9806),
        ('Hadapsar Rural', 'Haveli', 'Pune', 'Maharashtra', 8500, 18.5089, 73.9260),
        ('Trimbak Rural', 'Trimbak', 'Nashik', 'Maharashtra', 4300, 19.9383, 73.5303),
        ('Igatpuri', 'Igatpuri', 'Nashik', 'Maharashtra', 6700, 19.6967, 73.5622),
        ('Sinnar', 'Sinnar', 'Nashik', 'Maharashtra', 8900, 19.8456, 74.0012),
        ('Kalyan Rural', 'Kalyan', 'Thane', 'Maharashtra', 9400, 19.2403, 73.1305),
        ('Murbad', 'Murbad', 'Thane', 'Maharashtra', 4800, 19.2500, 73.4000),
        ('Shahapur', 'Shahapur', 'Thane', 'Maharashtra', 7200, 19.4500, 73.3300),
        ('Karveer Rural', 'Karveer', 'Kolhapur', 'Maharashtra', 6300, 16.7050, 74.2433),
        ('Panhala', 'Panhala', 'Kolhapur', 'Maharashtra', 4100, 16.8126, 74.1105),
        ('Ramtek', 'Ramtek', 'Nagpur', 'Maharashtra', 5900, 21.3970, 79.3300),
        ('Kamptee', 'Kamptee', 'Nagpur', 'Maharashtra', 8200, 21.2227, 79.1970),
        ('Paithan Rural', 'Paithan', 'Aurangabad', 'Maharashtra', 7100, 19.4800, 75.3800),
        ('Pandharpur Rural', 'Pandharpur', 'Solapur', 'Maharashtra', 9100, 17.6775, 75.3278)
    ]
    
    print("3. Inserting villages...")
    for v in villages_data:
        exists = await conn.fetchval(
            "SELECT 1 FROM public.villages WHERE village_name = $1 AND district = $2",
            v[0], v[2]
        )
        if not exists:
            await conn.execute(
                """INSERT INTO public.villages (village_name, block, district, state, population, latitude, longitude)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                v[0], v[1], v[2], v[3], v[4], v[5], v[6]
            )

    guidance_data = [
        (
            'Cholera / Acute Watery Diarrhea',
            'Waterborne',
            'RED',
            ['Severe watery diarrhea', 'Rice-water stool', 'Sunken eyes', 'Vomiting', 'Rapid dehydration'],
            'Immediately isolate patient in containment area. Administer rapid IV Ringer Lactate (30 ml/kg in 30 min for adults) if pulse weak. Once conscious, administer ORS aggressively. Notify PHC Medical Officer and MO-IDSP within 1 hour.',
            ['Lethargy or unconsciousness', 'Undetectable radial pulse', 'Skin pinch goes back very slowly (>2s)', 'Anuria / No urine output >6h'],
            'ORS: 100-200 ml after every loose stool. Ringer Lactate IV. Zinc supplement 20mg daily for 14 days in children.',
            'Strict isolation ward, 0.5% sodium hypochlorite disinfection for vomitus/feces, separate dedicated latrine.',
            'WHO Cholera Standard Outbreak Protocol & IDSP Guidelines',
            14
        ),
        (
            'Dengue Fever / DHF',
            'Vectorborne',
            'AMBER',
            ['High grade continuous fever (3-5 days)', 'Retro-orbital eye pain', 'Severe body ache (breakbone)', 'Petechial rash', 'Platelet drop'],
            'Test NS1 antigen RDT if within Day 1-5; IgM ELISA after Day 5. Encourage oral hydration (ORS, coconut water, lemon water). Avoid NSAIDs/Aspirin/Ibuprofen strictly due to hemorrhage risk. Prescribe ONLY Paracetamol for fever.',
            ['Persistent vomiting', 'Severe abdominal pain', 'Spontaneous mucosal bleeding (nose/gums)', 'Cold clammy extremities', 'Sudden temperature drop with restlessness'],
            'Paracetamol 500-650mg TDS (Max 3g/day in adults, 10-15 mg/kg in children). Plenty of oral fluids (min 2.5-3L/day).',
            'Use insecticide-treated bed nets (ITBN) day and night to prevent Aedes mosquito transmission to family members.',
            'NVBDCP Dengue Case Management Directives',
            22
        ),
        (
            'Plasmodium Falciparum / Vivax Malaria',
            'Vectorborne',
            'AMBER',
            ['Intermittent high fever with chills/rigors', 'Profuse sweating', 'Headache', 'Jaundice / Pale conjunctiva'],
            'Perform Rapid Diagnostic Test (Bivalent RDT for Pf/Pv) immediately and prepare thick/thin blood smear. If Pf positive, initiate Artemisinin-based Combination Therapy (ACT-SP) on Day 1.',
            ['Impaired consciousness / Cerebral malaria', 'Respiratory distress / Deep breathing', 'Severe anemia (Hb < 5g/dL)', 'Black/dark brown urine (Blackwater fever)'],
            'Pf Malaria: ACT-SP (Artesunate + Sulfadoxine-Pyrimethamine) + single dose Primaquine (0.75 mg/kg) on Day 2. Pv Malaria: Chloroquine 25mg/kg over 3 days + Primaquine 0.25mg/kg for 14 days.',
            'Indoor residual spraying (IRS) with synthetic pyrethroid in affected cluster within 48 hours.',
            'National Vector Borne Disease Control Programme (NVBDCP) Directives',
            9
        ),
        (
            'Acute Viral Gastroenteritis / Dysentery',
            'Waterborne',
            'GREEN',
            ['Mild to moderate loose stools', 'Cramping abdominal pain', 'Low-grade fever', 'Nausea'],
            'Assess hydration level. Distribute 4 ORS packets per patient. Educate family on boiling drinking water for at least 1 minute. Instruct to bring patient back if blood in stool appears.',
            ['Blood in stool (Dysentery)', 'Fever > 102F (>38.9C) unresponsive to antipyretics', 'Inability to drink fluids / Persistent vomiting'],
            'ORS solution + Oral Zinc 20mg/day for 14 days. Paracetamol 500mg SOS for fever. Ciprofloxacin ONLY if macroscopic blood in stool.',
            'Chlorinate community water sources / wells to maintain Free Residual Chlorine (FRC) >= 0.5 mg/L.',
            'IDSP Clinical Management Guidelines for Acute Diarrheal Diseases',
            18
        ),
        (
            'Hepatitis A & E (Acute Viral Jaundice)',
            'Waterborne',
            'AMBER',
            ['Scleral icterus (yellow eyes/skin)', 'Dark colored tea-like urine', 'Clay colored stools', 'Anorexia', 'Right upper quadrant pain'],
            'Inspect drinking water source of the household. Collect water sample for H2S vial test. Advise complete bed rest, low-fat high-carbohydrate diet. Strictly avoid hepatotoxic drugs.',
            ['Altered sleep-wake cycle / Hepatic encephalopathy', 'Bleeding tendency', 'Severe intractable vomiting', 'Rapidly shrinking liver span'],
            'Supportive therapy: High carbohydrate meals (glucose, sugarcane juice, fruit juices). Multivitamin supplements. No sedatives.',
            'Sanitary mapping of water distribution lines to detect sewage pipe cross-connections.',
            'IDSP Jaundice Outbreak Investigation & Case Management Manual',
            28
        ),
        (
            'Influenza-Like Illness (ILI) / SARI',
            'Airborne',
            'GREEN',
            ['Cough', 'Sore throat', 'Fever >= 38C', 'Runny nose', 'Myalgia'],
            'Categorize into Category A (mild, home isolation), Category B (high risk: elderly/pregnant/comorbid -> Oseltamivir), or Category C (Severe SARI -> Immediate hospitalization).',
            ['SPO2 < 94% on room air', 'Breathlessness / Stridor', 'Cyanosis (blue lips/fingers)', 'Hemoptysis'],
            'Category A: Home isolation, warm fluids, Paracetamol. Category B/C: Oseltamivir 75mg BD for 5 days.',
            'Surgical triple-layer mask for patient and caregiver, well-ventilated room.',
            'MoHFW Standard Guidelines for Pandemic Influenza & Respiratory Surveillance',
            12
        )
    ]

    print("4. Inserting clinical guidance protocols...")
    for g in guidance_data:
        exists = await conn.fetchval(
            "SELECT 1 FROM public.clinical_guidance WHERE condition = $1",
            g[0]
        )
        if not exists:
            await conn.execute(
                """INSERT INTO public.clinical_guidance (
                    condition, category, severity_tier, trigger_symptoms, immediate_action,
                    red_flags, standard_dosage, isolation_protocol, source_document, page_number
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
                g[0], g[1], g[2], g[3], g[4], g[5], g[6], g[7], g[8], g[9]
            )

    v_count = await conn.fetchval('SELECT count(*) FROM public.villages')
    g_count = await conn.fetchval('SELECT count(*) FROM public.clinical_guidance')
    print(f"✅ Seeding Complete! public.villages ({v_count} rows), public.clinical_guidance ({g_count} rows)")
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
