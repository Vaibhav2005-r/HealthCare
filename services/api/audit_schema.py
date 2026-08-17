import asyncio
import os
import json
import asyncpg
from dotenv import load_dotenv

load_dotenv("/Users/vaibhav/SIH/services/api/.env")
db_url = os.getenv("SUPABASE_DB_URL")

async def audit():
    conn = await asyncpg.connect(db_url)
    
    tables_res = await conn.fetch("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = [r['table_name'] for r in tables_res]
    
    schema_dump = {}
    for t in tables:
        cols = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
        """, t)
        
        pks = await conn.fetch("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
              AND tc.table_name = $1
        """, t)
        
        schema_dump[t] = {
            'primary_keys': [p['column_name'] for p in pks],
            'columns': {c['column_name']: {'type': c['data_type'], 'nullable': c['is_nullable'], 'default': c['column_default']} for c in cols}
        }
    
    with open("/Users/vaibhav/SIH/services/api/supabase_schema_dump.json", "w") as f:
        json.dump(schema_dump, f, indent=2)
        
    print(f"Successfully dumped schema for {len(tables)} tables to supabase_schema_dump.json")
    for t, details in schema_dump.items():
        print(f"\nTable: public.{t} (PK: {details['primary_keys']})")
        for col_name, meta in details['columns'].items():
            print(f"  • {col_name}: {meta['type']} (nullable={meta['nullable']})")
            
    await conn.close()

if __name__ == "__main__":
    asyncio.run(audit())
