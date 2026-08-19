import sys
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any, List

# Ensure parent directory is in path for ml imports
try:
    from ml.rag_pipeline import get_rag_engine
except Exception:
    def get_rag_engine():
        return None

router = APIRouter(prefix="/api/v1/rag", tags=["RAG & Guidelines Manager"])

@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Ingests official WHO / IDSP medical PDFs or protocols into Qdrant Vector DB.
    Parses pages, chunks text, generates embeddings, and indexes points with metadata.
    """
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        engine = get_rag_engine()
        result = engine.ingest_document_bytes(content, file.filename)
        
        if result.get("status") == "error":
            raise HTTPException(status_code=422, detail=result.get("message", "Failed to ingest document"))
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during document ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Internal ingestion error: {str(e)}")

@router.get("/documents")
async def list_documents() -> Dict[str, Any]:
    """
    Returns the list of all vectorized documents indexed in Qdrant Vector DB.
    """
    try:
        engine = get_rag_engine()
        docs = engine.list_documents()
        return {"documents": docs, "total_count": len(docs)}
    except Exception as e:
        print(f"Error listing documents: {e}")
        return {"documents": [], "total_count": 0}

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str) -> Dict[str, Any]:
    """
    Deletes all vector points associated with the given doc_id from Qdrant.
    """
    try:
        engine = get_rag_engine()
        success = engine.delete_document(doc_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found or could not be deleted.")
        return {"status": "success", "message": f"Document {doc_id} successfully deleted from Qdrant."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask")
async def ask_rag_endpoint(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Queries the RAG Engine with LLaMA 3.1 & Qdrant grounded clinical citations.
    """
    query = body.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        engine = get_rag_engine()
        if engine is not None:
            return engine.ask(query)
        raise HTTPException(status_code=503, detail="RAG Engine unavailable.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

