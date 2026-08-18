import os
import io
import time
import uuid
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "api", ".env"))

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        PointStruct,
        VectorParams,
        Distance,
        Filter,
        FieldCondition,
        MatchValue,
        ScrollRequest
    )
except ImportError:
    QdrantClient = None
    PointStruct = None
    VectorParams = None
    Distance = None
    Filter = None
    FieldCondition = None
    MatchValue = None
    ScrollRequest = None

# Standard Baseline Medical Corpus (IDSP / WHO)
BASELINE_MEDICAL_CORPUS = [
    {
        "doc_id": "base-idsp-01",
        "filename": "IDSP_National_Guidelines.pdf",
        "page": 14,
        "source": "IDSP National Guidelines (Page 14)",
        "text": "For severe dehydration and suspected Cholera, immediately start intravenous (IV) fluids. Ringer's Lactate is the fluid of choice. If pulse is weak or undetectable, start rapid IV infusion (30 ml/kg in 30 min for adults, 30 ml/kg in 1 hr for infants), followed by Oral Rehydration Salts (ORS) once conscious."
    },
    {
        "doc_id": "base-idsp-01",
        "filename": "IDSP_National_Guidelines.pdf",
        "page": 22,
        "source": "IDSP National Guidelines (Page 22)",
        "text": "In cases of persistent high fever suspected to be Dengue or Chikungunya, strictly avoid NSAIDs including Aspirin, Ibuprofen, and Brufen due to bleeding risk from thrombocytopenia. Use Paracetamol for fever management and closely monitor daily platelet count and hematocrit levels."
    },
    {
        "doc_id": "base-who-02",
        "filename": "WHO_Cholera_Outbreak_Standard_Protocol.pdf",
        "page": 8,
        "source": "WHO Cholera Standard Protocol (Page 8)",
        "text": "Cholera confirmation requires Cary-Blair medium stool culture or rapid diagnostic test (RDT) confirmation. Isolate the patient immediately in designated containment ward, ensure dedicated latrines with 0.5% chlorine disinfection, and provide ORS aggressively while awaiting laboratory culture results."
    },
    {
        "doc_id": "base-nvbdcp-03",
        "filename": "NVBDCP_Malaria_Containment_Directives.pdf",
        "page": 5,
        "source": "NVBDCP Malaria Directives (Page 5)",
        "text": "For confirmed Plasmodium falciparum malaria cases in high transmission blocks, administer Artemisinin-based Combination Therapy (ACT) immediately with a single dose of Primaquine on Day 2. Conduct active case surveillance in a 50-household radius around the index case within 48 hours."
    }
]

class RAGEngine:
    def __init__(self):
        print("Initializing Arogya Prahari RAG Engine...")
        self.model = None
        if SentenceTransformer is not None:
            try:
                print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"SentenceTransformer init warning: {e}. Falling back to baseline corpus.")
        else:
            print("SentenceTransformer not installed. Running in lightweight baseline corpus mode.")

        self.collection_name = "medical_guidelines"
        
        # Connect to Qdrant (Cloud first, fallback to local persistent or in-memory)
        qdrant_url = os.environ.get("QDRANT_URL")
        qdrant_key = os.environ.get("QDRANT_API_KEY")
        
        self.client = None
        if QdrantClient is not None and qdrant_url and qdrant_key:
            try:
                print(f"Connecting to Qdrant Cloud at {qdrant_url[:35]}...")
                self.client = QdrantClient(url=qdrant_url, api_key=qdrant_key, timeout=10)
                # Test connection
                self.client.get_collections()
                print("Successfully connected to Qdrant Cloud!")
            except Exception as e:
                print(f"Qdrant Cloud connection warning: {e}. Falling back to local storage.")
                self.client = None
                
        if self.client is None and QdrantClient is not None:
            local_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qdrant_storage")
            os.makedirs(local_db_path, exist_ok=True)
            print(f"Using local persistent Qdrant at {local_db_path}...")
            try:
                self.client = QdrantClient(path=local_db_path)
            except Exception as e:
                print(f"Local storage fallback error: {e}. Using in-memory Qdrant.")
                try:
                    self.client = QdrantClient(location=":memory:")
                except Exception:
                    self.client = None

        # Ensure collection exists if client is available
        if self.client is not None and self.model is not None:
            self._ensure_collection()
            # Seed baseline if empty
            self._seed_baseline_if_empty()

        # Initialize LLM Client
        api_key = os.environ.get("NVIDIA_API_KEY", "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")
        try:
            from langchain_nvidia_ai_endpoints import ChatNVIDIA
            self.llm_client = ChatNVIDIA(
                model="meta/llama-3.1-8b-instruct",
                api_key=api_key,
                temperature=0.2,
                top_p=0.9,
                max_completion_tokens=1024,
            )
            print("ChatNVIDIA (LLaMA 3.1 8B Instruct) initialized successfully.")
        except Exception as e:
            print(f"Warning initializing ChatNVIDIA: {e}")
            self.llm_client = None

    def _ensure_collection(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                print(f"Creating Qdrant collection: {self.collection_name}...")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
        except Exception as e:
            print(f"Error ensuring collection: {e}")

    def _seed_baseline_if_empty(self):
        try:
            count = self.client.count(collection_name=self.collection_name).count
            if count == 0:
                print("Collection is empty. Seeding baseline IDSP guidelines...")
                points = []
                for idx, doc in enumerate(BASELINE_MEDICAL_CORPUS):
                    vector = self.model.encode(doc["text"]).tolist()
                    points.append(
                        PointStruct(
                            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"baseline-{idx}")),
                            vector=vector,
                            payload={
                                "doc_id": doc["doc_id"],
                                "filename": doc["filename"],
                                "page": doc["page"],
                                "source": doc["source"],
                                "text": doc["text"],
                                "uploaded_at": "Baseline Built-in",
                                "chunk_index": idx
                            }
                        )
                    )
                self.client.upsert(collection_name=self.collection_name, points=points)
                print(f"Seeded {len(points)} baseline medical guideline points into Qdrant.")
        except Exception as e:
            print(f"Error during baseline seeding: {e}")

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """Recursive sentence-aware text chunker."""
        if not text:
            return []
        
        # Clean text
        text = " ".join(text.split())
        
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            # If not at the end of the text, try to break at a period, question mark, or space
            if end < text_len:
                boundary = max(
                    text.rfind('. ', start, end),
                    text.rfind('? ', start, end),
                    text.rfind('; ', start, end),
                    text.rfind('\n', start, end)
                )
                if boundary > start + (chunk_size // 2):
                    end = boundary + 1
                else:
                    space_boundary = text.rfind(' ', start, end)
                    if space_boundary > start + (chunk_size // 2):
                        end = space_boundary
            
            chunk = text[start:end].strip()
            if chunk and len(chunk) > 30:
                chunks.append(chunk)
                
            start = end - overlap if end < text_len else text_len
            
        return chunks

    def ingest_document_bytes(self, content: bytes, filename: str) -> Dict[str, Any]:
        """
        Parses PDF or text document bytes, extracts pages, chunks them,
        generates vector embeddings, and stores them in Qdrant Vector DB.
        """
        start_time = time.time()
        doc_id = f"doc-{int(time.time())}-{uuid.uuid4().hex[:6]}"
        pages_data: List[Dict[str, Any]] = []

        is_pdf = filename.lower().endswith(".pdf")

        if is_pdf:
            try:
                reader = pypdf.PdfReader(io.BytesIO(content))
                num_pages = len(reader.pages)
                print(f"Parsing PDF '{filename}' with {num_pages} pages...")
                
                for page_idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        pages_data.append({
                            "page_num": page_idx + 1,
                            "text": page_text
                        })
            except Exception as e:
                print(f"Error parsing PDF with pypdf: {e}. Attempting raw text extraction.")
                text = content.decode("utf-8", errors="ignore")
                pages_data.append({"page_num": 1, "text": text})
        else:
            # Plain text, markdown, CSV, or HTML
            text = content.decode("utf-8", errors="ignore")
            pages_data.append({"page_num": 1, "text": text})

        if not pages_data:
            return {
                "status": "error",
                "message": "No readable text could be extracted from the document.",
                "chunks_processed": 0
            }

        # Chunk all pages
        all_chunks: List[Dict[str, Any]] = []
        for p in pages_data:
            page_chunks = self.chunk_text(p["text"], chunk_size=550, overlap=80)
            for c_idx, c_text in enumerate(page_chunks):
                all_chunks.append({
                    "chunk_text": c_text,
                    "page_num": p["page_num"],
                    "source": f"{filename} (Page {p['page_num']})",
                    "chunk_index": len(all_chunks) + 1
                })

        if not all_chunks:
            return {
                "status": "error",
                "message": "Document did not contain sufficient textual content for chunking.",
                "chunks_processed": 0
            }

        print(f"Generated {len(all_chunks)} semantic chunks. Vectorizing in batches...")
        
        # Batch Embeddings
        chunk_texts = [c["chunk_text"] for c in all_chunks]
        embeddings = self.model.encode(chunk_texts, batch_size=32, show_progress_bar=False).tolist()

        # Construct Qdrant points
        points = []
        uploaded_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        for idx, (chunk_info, vector) in enumerate(zip(all_chunks, embeddings)):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "doc_id": doc_id,
                        "filename": filename,
                        "page": chunk_info["page_num"],
                        "source": chunk_info["source"],
                        "text": chunk_info["chunk_text"],
                        "uploaded_at": uploaded_at,
                        "chunk_index": chunk_info["chunk_index"],
                        "total_chunks": len(all_chunks)
                    }
                )
            )

        # Batch upsert to Qdrant
        BATCH_SIZE = 64
        for i in range(0, len(points), BATCH_SIZE):
            batch = points[i:i + BATCH_SIZE]
            self.client.upsert(collection_name=self.collection_name, points=batch)

        elapsed = round(time.time() - start_time, 2)
        print(f"Successfully ingested '{filename}': {len(points)} chunks across {len(pages_data)} pages in {elapsed}s.")

        return {
            "status": "success",
            "doc_id": doc_id,
            "filename": filename,
            "pages_processed": len(pages_data),
            "chunks_processed": len(points),
            "time_seconds": elapsed,
            "uploaded_at": uploaded_at,
            "message": f"Successfully vectorized {len(points)} chunks into Qdrant Vector DB."
        }

    def list_documents(self) -> List[Dict[str, Any]]:
        """Retrieves list of distinct documents indexed in Qdrant."""
        try:
            scroll_result = self.client.scroll(
                collection_name=self.collection_name,
                limit=1000,
                with_payload=True,
                with_vectors=False
            )
            points = scroll_result[0]
            
            docs_map: Dict[str, Dict[str, Any]] = {}
            for p in points:
                payload = p.payload or {}
                doc_id = payload.get("doc_id", "unknown")
                filename = payload.get("filename", "Unknown Document")
                uploaded_at = payload.get("uploaded_at", "Unknown")
                page = payload.get("page", 1)
                
                if doc_id not in docs_map:
                    docs_map[doc_id] = {
                        "id": doc_id,
                        "name": filename,
                        "chunks_count": 0,
                        "pages": set(),
                        "uploaded_at": uploaded_at,
                        "status": "SUCCESS",
                        "progress": 100
                    }
                docs_map[doc_id]["chunks_count"] += 1
                docs_map[doc_id]["pages"].add(page)

            result = []
            for doc_id, info in docs_map.items():
                result.append({
                    "id": info["id"],
                    "name": info["name"],
                    "chunks_count": info["chunks_count"],
                    "pages_count": len(info["pages"]),
                    "uploaded_at": info["uploaded_at"],
                    "status": info["status"],
                    "progress": info["progress"]
                })
            
            # Sort newest first
            return sorted(result, key=lambda x: x["uploaded_at"], reverse=True)
        except Exception as e:
            print(f"Error listing documents from Qdrant: {e}")
            return []

    def delete_document(self, doc_id: str) -> bool:
        """Deletes all chunks belonging to a doc_id from Qdrant."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="doc_id",
                            match=MatchValue(value=doc_id)
                        )
                    ]
                )
            )
            print(f"Deleted document {doc_id} from Qdrant.")
            return True
        except Exception as e:
            print(f"Error deleting document {doc_id}: {e}")
            return False

    def ask(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Performs semantic search in Qdrant, aggregates context, and generates
        a medical-grade grounded clinical answer via Meta LLaMA 3.1 with exact citations.
        """
        search_result = []
        if self.model is not None and self.client is not None:
            try:
                query_vector = self.model.encode(query).tolist()
                if hasattr(self.client, 'query_points'):
                    search_result = self.client.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        limit=top_k
                    ).points
                elif hasattr(self.client, 'search'):
                    search_result = self.client.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        limit=top_k
                    )
            except Exception as e:
                print(f"Qdrant search error: {e}")
                search_result = []
        else:
            # Fallback to keyword matching on baseline corpus
            q_lower = query.lower()
            matched = [
                doc for doc in BASELINE_MEDICAL_CORPUS
                if any(w in doc["text"].lower() or w in doc["filename"].lower() for w in q_lower.split())
            ]
            if matched:
                return {
                    "answer": f"Clinical Directive (IDSP Guidelines):\n\n{matched[0]['text']}",
                    "citations": [matched[0]["source"]],
                    "retrieved_excerpts": [{"source": matched[0]["source"], "text": matched[0]["text"]}]
                }

        if not search_result:
            return {
                "answer": "No relevant medical guidelines or clinical containment protocols found in the active knowledge base.",
                "citations": [],
                "retrieved_excerpts": []
            }

        context_blocks = []
        citations_set = set()
        retrieved_excerpts = []

        for idx, match in enumerate(search_result):
            payload = match.payload or {}
            text = payload.get("text", "")
            source = payload.get("source", "Official Protocol")
            score = getattr(match, 'score', 0.0)
            
            citations_set.add(source)
            context_blocks.append(f"[{idx+1}] {source}:\n\"{text}\"")
            retrieved_excerpts.append({
                "source": source,
                "text": text,
                "score": round(score, 3)
            })

        combined_context = "\n\n".join(context_blocks)
        citations_list = list(citations_set)

        system_instruction = (
            "You are Arogya Prahari's AI Medical Intelligence & Clinical Guidelines Assistant for the National Integrated Disease Surveillance Programme (IDSP) and WHO.\n"
            "Answer the health worker's or District Health Officer's question strictly and accurately using the provided medical context.\n"
            "Structure your answer clearly with actionable clinical steps, triage protocols, or medical directives.\n"
            "At the end of your response, list the cited sources."
        )

        prompt = (
            f"CLINICAL GUIDELINES CONTEXT:\n{combined_context}\n\n"
            f"QUESTION:\n{query}\n\n"
            f"Provide a structured, grounded clinical answer with reference citations."
        )

        if self.llm_client:
            try:
                lc_messages = [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ]
                response = self.llm_client.invoke(lc_messages, chat_template_kwargs={"enable_thinking": False})
                answer_text = response.content
            except Exception as e:
                print(f"Error invoking NVIDIA LLM: {e}")
                # Grounded fallback
                answer_text = (
                    f"Based on the retrieved clinical directives ({', '.join(citations_list)}):\n\n"
                    + "\n\n".join([f"• {e['text']}" for e in retrieved_excerpts])
                )
        else:
            answer_text = (
                f"Based on the indexed medical guidelines ({', '.join(citations_list)}):\n\n"
                + "\n\n".join([f"• {e['text']}" for e in retrieved_excerpts])
            )

        return {
            "answer": answer_text,
            "citations": citations_list,
            "retrieved_excerpts": retrieved_excerpts,
            "top_source": citations_list[0] if citations_list else None
        }

_rag_engine_instance = None

def get_rag_engine() -> RAGEngine:
    global _rag_engine_instance
    if _rag_engine_instance is None:
        _rag_engine_instance = RAGEngine()
    return _rag_engine_instance

if __name__ == "__main__":
    engine = get_rag_engine()
    docs = engine.list_documents()
    print("Indexed docs in Qdrant:", docs)
    res = engine.ask("What is the exact fluid protocol for severe dehydration and cholera?")
    print("\n--- AI RESPONSE ---")
    print(res["answer"])
    print("\n--- CITATIONS ---")
    print(res["citations"])

