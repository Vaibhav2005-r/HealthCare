from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
import os

# Example IDSP Medical Guideline Text Snippets
medical_corpus = [
    {
        "id": 1,
        "source": "IDSP National Guidelines, Page 14",
        "text": "For severe dehydration, immediately start intravenous (IV) fluids. Ringer's Lactate is the fluid of choice. If pulse is weak, start rapid IV infusion."
    },
    {
        "id": 2,
        "source": "IDSP National Guidelines, Page 22",
        "text": "In cases of persistent high fever suspected to be Dengue, avoid Aspirin and Brufen. Use Paracetamol for fever management and monitor platelet count."
    },
    {
        "id": 3,
        "source": "Cholera Standard Protocol, Page 8",
        "text": "Cholera confirmation requires a stool culture. Isolate the patient immediately and provide Oral Rehydration Solution (ORS) while awaiting test results."
    }
]

class RAGEngine:
    def __init__(self):
        print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        print("Connecting to local in-memory Qdrant database (for prototype)...")
        self.client = QdrantClient(location=":memory:")
        self.collection_name = "medical_guidelines"
        
        self.client.recreate_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        
        print("Embedding medical corpus...")
        points = []
        for doc in medical_corpus:
            vector = self.model.encode(doc["text"]).tolist()
            points.append(
                PointStruct(
                    id=doc["id"],
                    vector=vector,
                    payload={"text": doc["text"], "source": doc["source"]}
                )
            )
            
        self.client.upsert(collection_name=self.collection_name, points=points)
        print(f"Successfully loaded {len(points)} documents into Qdrant.")
        
        from langchain_nvidia_ai_endpoints import ChatNVIDIA
        api_key = os.environ.get("NVIDIA_API_KEY", "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")
        self.llm_client = ChatNVIDIA(
            model="meta/llama-3.1-8b-instruct",
            api_key=api_key,
            temperature=0.3,
            top_p=0.95,
            max_completion_tokens=1024,
        )

    def ask(self, query: str):
        query_vector = self.model.encode(query).tolist()
        search_result = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=1
        )
        
        if not search_result:
            return {"answer": "No relevant guidelines found.", "source": None}
            
        top_match = search_result[0]
        context = top_match.payload['text']
        source = top_match.payload['source']
        
        prompt = f"Use the following medical context to answer the question. Cite the source at the end.\n\nContext: {context}\nSource: {source}\n\nQuestion: {query}"
        lc_messages = [{"role": "user", "content": prompt}]
        
        try:
            response = self.llm_client.invoke(lc_messages, chat_template_kwargs={"enable_thinking": False})
            return {
                "answer": response.content,
                "source": source,
                "retrieved_context": context
            }
        except Exception as e:
            return {"error": str(e)}

if __name__ == "__main__":
    # Test the standalone engine
    engine = RAGEngine()
    res = engine.ask("Patient has severe dehydration. What should be done?")
    print(res["answer"])
