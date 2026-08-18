import asyncio
import os
import json
import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
db_url = os.getenv("SUPABASE_DB_URL")

async def main():
    print(f"Connecting to Supabase PostgreSQL at {db_url.split('@')[-1]}...")
    conn = await asyncpg.connect(db_url)
    
    tables_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """
    tables = [r['table_name'] for r in await conn.fetch(tables_query)]
    print(f"Found {len(tables)} tables in public schema: {tables}\n")
    
    for t in tables:
        print("=" * 60)
        print(f"TABLE: public.{t}")
        print("=" * 60)
        
        cols = await conn.fetch(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
            t
        )
        print("Columns:")
        for c in cols:
            print(f"  - {c['column_name']}: {c['data_type']} (nullable: {c['is_nullable']})")
            
        rows = await conn.fetch(f'SELECT * FROM public."{t}"')
        print(f"\nRows ({len(rows)}):")
        for r in rows:
            row_dict = {}
            for k, v in dict(r).items():
                if hasattr(v, 'isoformat'):
                    row_dict[k] = v.isoformat()
                else:
                    row_dict[k] = v
            print(" ", json.dumps(row_dict, default=str))
        print("\n")
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
