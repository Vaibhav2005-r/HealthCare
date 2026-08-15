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

def setup_rag_database():
    print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
    # This is a small, fast model perfect for a free-tier/hackathon RAG
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Connecting to local in-memory Qdrant database (for prototype)...")
    # For production, replace `location=":memory:"` with your Qdrant Cloud URL/API Key
    client = QdrantClient(location=":memory:")
    
    collection_name = "medical_guidelines"
    
    # 1. Create Collection
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    
    # 2. Embed and Upsert Data
    print("Embedding medical corpus...")
    points = []
    for doc in medical_corpus:
        vector = model.encode(doc["text"]).tolist()
        points.append(
            PointStruct(
                id=doc["id"],
                vector=vector,
                payload={"text": doc["text"], "source": doc["source"]}
            )
        )
        
    client.upsert(
        collection_name=collection_name,
        points=points
    )
    print(f"Successfully loaded {len(points)} documents into Qdrant.")
    
    # 3. Test a Query
    query = "Patient has severe dehydration. What should be done?"
    print(f"\nTesting Query: '{query}'")
    
    query_vector = model.encode(query).tolist()
    search_result = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=1
    )
    
    if search_result:
        top_match = search_result[0]
        print("\n--- RAG RETRIEVAL RESULT ---")
        print(f"Source: {top_match.payload['source']}")
        print(f"Text: {top_match.payload['text']}")
        print(f"Score: {top_match.score:.4f}")
        print("----------------------------\n")
        print("Generating response using NVIDIA AI Endpoints (Gemma)...")
        from langchain_nvidia_ai_endpoints import ChatNVIDIA

        # Remember to replace "Your_API_KEY" with your actual NVIDIA API key!
        api_key = os.environ.get("NVIDIA_API_KEY", "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")

        try:
            llm_client = ChatNVIDIA(
                model="meta/llama-3.1-8b-instruct",
                api_key=api_key,
                temperature=0.3, # Lower temperature is better for RAG (more factual)
                top_p=0.95,
                max_completion_tokens=1024,
            )

            # Construct the prompt passing the retrieved context and question
            prompt = f"Use the following medical context to answer the question. Cite the source at the end.\n\nContext: {top_match.payload['text']}\nSource: {top_match.payload['source']}\n\nQuestion: {query}"
            
            lc_messages = [
                {"role": "user", "content": prompt}
            ]

            response = llm_client.invoke(lc_messages, chat_template_kwargs={"enable_thinking": False})
            
            print("\n=== AI CLINICAL RESPONSE ===")
            if response.additional_kwargs and "reasoning_content" in response.additional_kwargs:
                print("[Thinking]:")
                print(response.additional_kwargs["reasoning_content"])
                print("-" * 20)
                
            print(response.content)
            print("============================\n")
            
        except ImportError:
            print("\nERROR: You need to install the langchain package first.")
            print("Run: pip install langchain-nvidia-ai-endpoints langchain-core")
        except Exception as e:
            print(f"\nFailed to query NVIDIA API: {e}")
            print("Did you insert your actual API key?")

if __name__ == "__main__":
    setup_rag_database()
