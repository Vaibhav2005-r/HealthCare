import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

collection_name = "case_report_notes"
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
model = SentenceTransformer('all-MiniLM-L6-v2')

def setup_qdrant_collection():
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )

async def embed_and_upsert_notes(case_reports: list):
    """
    Takes a list of case_reports (dicts), generates embeddings for their notes,
    and upserts them into Qdrant.
    """
    setup_qdrant_collection()
    
    points = []
    for report in case_reports:
        note = report.get('notes')
        if not note:
            continue
            
        vector = model.encode(note).tolist()
        payload = {
            "district": report.get("district"),
            "suspected_disease": report.get("suspected_disease"),
            "reported_at": str(report.get("reported_at")),
            "text": note
        }
        
        points.append(
            PointStruct(
                id=str(report.get('id')),
                vector=vector,
                payload=payload
            )
        )
        
    if points:
        client.upsert(collection_name=collection_name, points=points)
        print(f"Upserted {len(points)} notes to Qdrant.")
