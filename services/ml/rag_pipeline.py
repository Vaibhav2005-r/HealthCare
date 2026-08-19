import os
import io
import time
import uuid
import re
import httpx
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

# Comprehensive Standard Baseline Medical Corpus (IDSP / NVBDCP / WHO)
BASELINE_MEDICAL_CORPUS = [
    {
        "doc_id": "base-idsp-01",
        "condition": "Cholera / Acute Watery Diarrhea",
        "filename": "IDSP_National_Guidelines.pdf",
        "page": 14,
        "source": "IDSP National Guidelines (Page 14)",
        "keywords": ["cholera", "diarrhea", "diarrhoea", "dehydration", "ors", "vomit", "water", "fluid", "ringer", "lactate", "stool", "rice"],
        "text": "For severe dehydration and suspected Cholera, immediately start intravenous (IV) fluids. Ringer's Lactate is the fluid of choice (100 ml/kg: 30 ml/kg in 30 min for adults followed by 70 ml/kg in 2.5 hrs). Give Oral Rehydration Salts (ORS) as soon as the patient can drink. For pediatric patients, administer Zinc supplementation (20 mg/day for 14 days). Disinfect water sources using 0.5% chlorine solution."
    },
    {
        "doc_id": "base-idsp-02",
        "condition": "Dengue Fever & Dengue Hemorrhagic Fever",
        "filename": "IDSP_National_Guidelines.pdf",
        "page": 22,
        "source": "IDSP National Guidelines (Page 22)",
        "keywords": ["dengue", "nsaid", "aspirin", "ibuprofen", "paracetamol", "platelet", "thrombocytopenia", "hemorrhagic", "fever", "retro-orbital", "ns1", "bleeding"],
        "text": "In cases of suspected Dengue or Chikungunya, strictly avoid NSAIDs including Aspirin, Ibuprofen, Diclofenac, and Mefenamic Acid due to acute gastrointestinal hemorrhage and platelet aggregation inhibition. Prescribe Paracetamol (500mg - 650mg every 6 hours, maximum 4g/day) for fever management. Ensure 2.5-3.0 Liters of oral hydration daily and monitor daily platelet count and hematocrit levels."
    },
    {
        "doc_id": "base-who-02",
        "condition": "WHO Cholera & Outbreak Containment",
        "filename": "WHO_Cholera_Outbreak_Standard_Protocol.pdf",
        "page": 8,
        "source": "WHO Cholera Standard Protocol (Page 8)",
        "keywords": ["cholera", "cary-blair", "culture", "isolation", "latrine", "containment", "chlorine", "outbreak", "rdt"],
        "text": "Cholera outbreak verification requires Cary-Blair transport medium stool culture or rapid diagnostic test (RDT) confirmation. Isolate the patient immediately in designated containment ward, ensure dedicated latrines with 0.5% chlorine disinfection, and provide ORS aggressively while awaiting laboratory culture results. Superchlorinate public drinking water wells to 0.5 ppm free residual chlorine."
    },
    {
        "doc_id": "base-nvbdcp-03",
        "condition": "Plasmodium Falciparum & Vivax Malaria",
        "filename": "NVBDCP_Malaria_Containment_Directives.pdf",
        "page": 5,
        "source": "NVBDCP Malaria Directives (Page 5)",
        "keywords": ["malaria", "falciparum", "vivax", "act", "artemisinin", "primaquine", "chloroquine", "mosquito", "smear", "rdt", "parasite"],
        "text": "For confirmed Plasmodium falciparum malaria, administer Artemisinin-based Combination Therapy (ACT: Artesunate + Sulfadoxine-Pyrimethamine or Artemether-Lumefantrine for 3 days) plus a single dose of Primaquine (0.75 mg/kg base on Day 2). For Plasmodium vivax, administer Chloroquine (25 mg/kg over 3 days) followed by Primaquine (0.25 mg/kg daily for 14 days after checking G6PD status). Conduct active case surveillance in a 50-household radius around the index case within 48 hours."
    },
    {
        "doc_id": "base-idsp-04",
        "condition": "Acute Viral Hepatitis / Jaundice",
        "filename": "IDSP_Jaundice_Outbreak_Protocol.pdf",
        "page": 11,
        "source": "IDSP Jaundice Outbreak Protocol (Page 11)",
        "keywords": ["hepatitis", "jaundice", "liver", "bilirubin", "yellow", "urine", "waterborne", "hepatitis a", "hepatitis e", "fecal-oral"],
        "text": "Acute Viral Hepatitis A and E are waterborne infections spread via fecal-oral contamination during monsoon months. Management is supportive: bed rest, high-carbohydrate low-fat diet, clean boiled drinking water, and strict avoidance of hepatotoxic medications and sedatives. Screen pregnant women immediately as Hepatitis E carries high maternal mortality and risk of fulminant hepatic failure."
    },
    {
        "doc_id": "base-nvbdcp-05",
        "condition": "Leptospirosis / Post-Flood Fevers",
        "filename": "NVBDCP_Leptospirosis_Directives.pdf",
        "page": 9,
        "source": "NVBDCP Leptospirosis Directives (Page 9)",
        "keywords": ["leptospirosis", "flood", "wading", "waterlogged", "calf", "conjunctival", "suffusion", "doxycycline", "penicillin", "rodent"],
        "text": "For patients with sudden high fever, severe calf muscle tenderness, and conjunctival suffusion following exposure to floodwaters or rodent-contaminated mud, suspect Leptospirosis. For mild cases, prescribe Doxycycline 100 mg twice daily for 7 days. For severe cases with renal or pulmonary involvement (Weil's disease), administer IV Crystalline Penicillin 20–30 lakh units every 6 hours and arrange immediate ICU transfer."
    },
    {
        "doc_id": "base-mohfw-06",
        "condition": "Influenza-Like Illness (ILI) & SARI",
        "filename": "MoHFW_Respiratory_Surveillance.pdf",
        "page": 16,
        "source": "MoHFW Respiratory Surveillance Guidelines (Page 16)",
        "keywords": ["influenza", "ili", "sari", "cough", "cold", "sore throat", "respiratory", "oseltamivir", "tamiflu", "oxygen", "pneumonia"],
        "text": "For Influenza-Like Illness (fever >38°C with cough or sore throat), assess oxygen saturation (SpO2). Category A (mild) requires home isolation, paracetamol, and hydration. Category B (high-risk individuals, pregnant, elderly, immunocompromised) should receive Oseltamivir 75mg twice daily for 5 days. Category C (SpO2 <94%, breathlessness, chest pain) requires immediate hospitalization, supplemental oxygen, and systemic antiviral therapy."
    }
]

STOP_WORDS = {
    "what", "is", "the", "for", "and", "in", "to", "of", "a", "an", "how", "why", "who", 
    "when", "where", "which", "tell", "me", "about", "cases", "patient", "disease", 
    "protocol", "treatment", "guidelines", "give", "can", "you", "i", "we", "do", "does",
    "should", "with", "from", "by", "on", "at", "it", "this", "that", "these", "those"
}

class RAGEngine:
    def __init__(self):
        print("Initializing Arogya Prahari RAG Engine...")
        self.model = None
        if SentenceTransformer is not None:
            try:
                print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"SentenceTransformer init warning: {e}. Falling back to keyword & Supabase semantic matching.")
        else:
            print("SentenceTransformer not installed. Running in lightweight multi-layer corpus mode.")

        self.collection_name = "medical_guidelines"
        
        # Connect to Qdrant (Cloud first, fallback to local persistent or in-memory)
        qdrant_url = os.environ.get("QDRANT_URL")
        qdrant_key = os.environ.get("QDRANT_API_KEY")
        
        self.client = None
        if QdrantClient is not None and qdrant_url and qdrant_key:
            try:
                print(f"Connecting to Qdrant Cloud at {qdrant_url[:35]}...")
                self.client = QdrantClient(url=qdrant_url, api_key=qdrant_key, timeout=10)
                self.client.get_collections()
                print("Successfully connected to Qdrant Cloud!")
            except Exception as e:
                print(f"Qdrant Cloud connection warning: {e}. Falling back to local storage.")
                self.client = None
                
        if self.client is None and QdrantClient is not None:
            local_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qdrant_storage")
            os.makedirs(local_db_path, exist_ok=True)
            try:
                self.client = QdrantClient(path=local_db_path)
            except Exception as e:
                try:
                    self.client = QdrantClient(location=":memory:")
                except Exception:
                    self.client = None

        # Ensure collection exists if client is available
        if self.client is not None and self.model is not None:
            self._ensure_collection()
            self._seed_baseline_if_empty()

        # NVIDIA API Key setup
        self.nvidia_api_key = os.environ.get("NVIDIA_API_KEY")
        self.nvidia_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        self.nvidia_model = "meta/llama-3.1-8b-instruct"

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
        
        text = " ".join(text.split())
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            if end < text_len:
                boundary = max(
                    text.rfind('. ', start, end),
                    text.rfind('? ', start, end),
                    text.rfind('; ', start, end),
                    text.rfind('\n', start, end)
                )
                if boundary != -1 and boundary > start + 100:
                    end = boundary + 1
                else:
                    space_boundary = text.rfind(' ', start, end)
                    if space_boundary != -1 and space_boundary > start + 100:
                        end = space_boundary
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            if end >= text_len:
                break
            start = max(start + 1, end - overlap)
            
        return chunks

    def ingest_document_bytes(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Parses and ingests a PDF or text document into Qdrant."""
        if self.model is None or self.client is None:
            return {
                "status": "error",
                "message": "Vector indexing engine is not fully initialized in this environment.",
                "chunks_processed": 0
            }

        start_time = time.time()
        doc_id = str(uuid.uuid4())
        pages_data = []

        if filename.lower().endswith(".pdf"):
            if pypdf is None:
                return {
                    "status": "error",
                    "message": "pypdf library not available.",
                    "chunks_processed": 0
                }
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for idx, page in enumerate(reader.pages):
                    txt = page.extract_text() or ""
                    if txt.strip():
                        pages_data.append({"page_num": idx + 1, "text": txt})
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to parse PDF: {str(e)}",
                    "chunks_processed": 0
                }
        else:
            try:
                txt = file_bytes.decode("utf-8", errors="ignore")
                pages_data.append({"page_num": 1, "text": txt})
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to decode text: {str(e)}",
                    "chunks_processed": 0
                }

        if not pages_data:
            return {
                "status": "error",
                "message": "No readable text could be extracted from the document.",
                "chunks_processed": 0
            }

        all_chunks: List[Dict[str, Any]] = []
        for p in pages_data:
            page_chunks = self.chunk_text(p["text"], chunk_size=550, overlap=80)
            for c_text in page_chunks:
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

        chunk_texts = [c["chunk_text"] for c in all_chunks]
        embeddings = self.model.encode(chunk_texts, batch_size=32, show_progress_bar=False).tolist()

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

        BATCH_SIZE = 64
        for i in range(0, len(points), BATCH_SIZE):
            batch = points[i:i + BATCH_SIZE]
            self.client.upsert(collection_name=self.collection_name, points=batch)

        elapsed = round(time.time() - start_time, 2)
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
        if self.client is None:
            return []
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
            
            return sorted(result, key=lambda x: x["uploaded_at"], reverse=True)
        except Exception as e:
            print(f"Error listing documents from Qdrant: {e}")
            return []

    def delete_document(self, doc_id: str) -> bool:
        """Deletes all chunks belonging to a doc_id from Qdrant."""
        if self.client is None:
            return False
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
            return True
        except Exception as e:
            print(f"Error deleting document {doc_id}: {e}")
            return False

    def _fetch_supabase_guidance(self, query: str) -> List[Dict[str, Any]]:
        """Queries Supabase public.clinical_guidance for disease matching."""
        supabase_url = os.environ.get("SUPABASE_URL", "https://orjszwyrfluvvkqlkvzq.supabase.co")
        supabase_key = os.environ.get("SUPABASE_KEY", "")
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}"
        }
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(f"{supabase_url}/rest/v1/clinical_guidance?select=*&limit=10", headers=headers)
                if res.status_code == 200:
                    rows = res.json()
                    # Filter and score rows matching query keywords
                    tokens = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', query.lower()) if w not in STOP_WORDS]
                    scored_rows = []
                    for r in rows:
                        row_text = f"{r.get('condition', '')} {r.get('category', '')} {r.get('immediate_action', '')} {' '.join(r.get('red_flags') or [])}".lower()
                        score = sum(1 for t in tokens if t in row_text)
                        if score > 0:
                            scored_rows.append((score, r))
                    scored_rows.sort(key=lambda x: x[0], reverse=True)
                    return [r for _, r in scored_rows]
        except Exception as e:
            print(f"Supabase guidance query error: {e}")
        return []

    def _retrieve_relevant_contexts(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieves and ranks relevant medical passages from Qdrant, Supabase, and Guidelines."""
        results: List[Dict[str, Any]] = []
        seen_texts = set()

        # 1. Qdrant Vector Search
        if self.model is not None and self.client is not None:
            try:
                query_vector = self.model.encode(query).tolist()
                points = []
                if hasattr(self.client, 'query_points'):
                    points = self.client.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        limit=top_k
                    ).points
                elif hasattr(self.client, 'search'):
                    points = self.client.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        limit=top_k
                    )
                for p in points:
                    payload = p.payload or {}
                    txt = payload.get("text", "").strip()
                    src = payload.get("source", "Indexed Document")
                    if txt and txt not in seen_texts:
                        seen_texts.add(txt)
                        results.append({
                            "source": src,
                            "text": txt,
                            "score": getattr(p, 'score', 0.85)
                        })
            except Exception as e:
                print(f"Qdrant search error: {e}")

        # 2. Supabase Clinical Guidance Records
        supabase_records = self._fetch_supabase_guidance(query)
        for r in supabase_records:
            cond = r.get("condition", "Medical Condition")
            action = r.get("immediate_action", "")
            dosage = r.get("standard_dosage", "")
            red_flags = ", ".join(r.get("red_flags") or [])
            src = f"{r.get('source_document', 'IDSP Protocol')} (Page {r.get('page_number', 1)})"
            
            full_txt = f"{cond} Protocol: Immediate Action: {action}. Standard Dosage: {dosage}. Red Flag Warning Signs: {red_flags}."
            if full_txt not in seen_texts:
                seen_texts.add(full_txt)
                results.append({
                    "source": src,
                    "text": full_txt,
                    "score": 0.95
                })

        # 3. Match Baseline Medical Corpus with Token Scoring
        tokens = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', query.lower()) if w not in STOP_WORDS]
        scored_corpus = []
        for doc in BASELINE_MEDICAL_CORPUS:
            doc_keywords = doc.get("keywords", [])
            doc_text_lower = doc["text"].lower() + " " + doc.get("condition", "").lower()
            match_score = 0
            for t in tokens:
                if t in doc_keywords:
                    match_score += 3
                elif t in doc_text_lower:
                    match_score += 1
            if match_score > 0:
                scored_corpus.append((match_score, doc))
        
        scored_corpus.sort(key=lambda x: x[0], reverse=True)
        for _, doc in scored_corpus:
            if doc["text"] not in seen_texts:
                seen_texts.add(doc["text"])
                results.append({
                    "source": doc["source"],
                    "text": doc["text"],
                    "score": 0.90
                })

        # If still empty, supply general IDSP surveillance principles
        if not results:
            for doc in BASELINE_MEDICAL_CORPUS[:2]:
                results.append({
                    "source": doc["source"],
                    "text": doc["text"],
                    "score": 0.70
                })

        return results[:top_k]

    def _call_nvidia_nim(self, query: str, context: str) -> Optional[str]:
        """Calls NVIDIA NIM Meta LLaMA 3.1 LLM via direct HTTP request."""
        api_key = self.nvidia_api_key
        if not api_key:
            return None

        system_instruction = (
            "You are Arogya Prahari's AI Medical Intelligence & Clinical Guidelines Assistant for the National Integrated Disease Surveillance Programme (IDSP), NVBDCP, and WHO.\n"
            "Answer the health worker's or District Health Officer's question thoroughly, accurately, and specifically based on the provided clinical context.\n"
            "Structure your answer with clear markdown headings, immediate action steps, standard treatment/dosage, red flag warning signs, and protocol citations.\n"
            "Never give a generic placeholder answer; directly address the specific disease, drug, symptom, or procedure in the user's question."
        )

        payload = {
            "model": self.nvidia_model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {
                    "role": "user",
                    "content": f"CLINICAL GUIDELINES CONTEXT:\n{context}\n\nUSER QUESTION:\n{query}\n\nProvide a structured, grounded clinical answer:"
                }
            ],
            "temperature": 0.2,
            "max_tokens": 800
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(self.nvidia_url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices")
                    if choices and len(choices) > 0:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        if content:
                            return content
                else:
                    print(f"NVIDIA API Error: HTTP {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"NVIDIA NIM connection error: {e}")

        return None

    def ask(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Performs multi-layer retrieval, compiles context, and generates
        a grounded clinical response via NVIDIA LLaMA 3.1 with exact citations.
        """
        retrieved = self._retrieve_relevant_contexts(query, top_k=top_k)
        
        context_blocks = []
        citations_set = set()
        excerpts_list = []

        for idx, item in enumerate(retrieved):
            src = item.get("source", "Official Protocol")
            txt = item.get("text", "")
            score = item.get("score", 0.85)
            
            citations_set.add(src)
            context_blocks.append(f"[{idx+1}] {src}:\n\"{txt}\"")
            excerpts_list.append({
                "source": src,
                "text": txt,
                "score": round(score, 3)
            })

        combined_context = "\n\n".join(context_blocks)
        citations_list = list(citations_set)

        # 1. Attempt LLM generation with NVIDIA NIM
        answer_text = self._call_nvidia_nim(query, combined_context)

        # 2. If NVIDIA NIM is unreachable, construct a rich structured response from matched excerpts
        if not answer_text:
            if excerpts_list:
                primary = excerpts_list[0]
                answer_text = (
                    f"**Clinical Surveillance Directive ({primary['source']})**\n\n"
                    f"**Guideline Extract:**\n{primary['text']}\n\n"
                    f"**Additional Clinical References:**\n"
                    + "\n".join([f"- **{e['source']}**: {e['text'][:140]}..." for e in excerpts_list[1:]])
                )
            else:
                answer_text = "No relevant medical guidelines or clinical containment protocols found in the active knowledge base."

        return {
            "answer": answer_text,
            "citations": citations_list,
            "retrieved_excerpts": excerpts_list,
            "top_source": citations_list[0] if citations_list else "IDSP Guidelines"
        }

_rag_engine_instance = None

def get_rag_engine() -> RAGEngine:
    global _rag_engine_instance
    if _rag_engine_instance is None:
        _rag_engine_instance = RAGEngine()
    return _rag_engine_instance

if __name__ == "__main__":
    engine = get_rag_engine()
    print("Testing Dengue Query:")
    res1 = engine.ask("What is the protocol for Dengue and what medicines to avoid?")
    print("Answer 1:", res1["answer"][:200], "\nCitations:", res1["citations"])
    
    print("\nTesting Malaria Query:")
    res2 = engine.ask("What is the treatment for Plasmodium Falciparum vs Vivax Malaria?")
    print("Answer 2:", res2["answer"][:200], "\nCitations:", res2["citations"])
