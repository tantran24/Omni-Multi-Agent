import os
import uuid
from typing import List, Optional
from huggingface_hub import snapshot_download

from langchain.schema import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import PyMuPDFLoader, PDFMinerLoader  

from qdrant_client import QdrantClient
from qdrant_client.http import models as q_models

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (PdfPipelineOptions, RapidOcrOptions, smolvlm_picture_description, TableFormerMode)
from docling.document_converter import (
    ConversionResult,
    DocumentConverter,
    InputFormat,
    PdfFormatOption,
)


def load_documents_from_directory(
    directory_path: str, extensions: Optional[List[str]] = None
) -> List[Document]:
    """
    Load and aggregate text documents from a directory.
    Use Docling + RapidOCR to parse PDF files for better structure.
    """
    extensions = extensions or [".txt", ".md", ".pdf"]
    docs: List[Document] = []

    print("Downloading RapidOCR models")
    download_path = snapshot_download(repo_id="SWHL/RapidOCR")

    det_model_path = os.path.join(download_path, "PP-OCRv4", "en_PP-OCRv3_det_infer.onnx")
    rec_model_path = os.path.join(download_path, "PP-OCRv4", "ch_PP-OCRv4_rec_server_infer.onnx")
    cls_model_path = os.path.join(download_path, "PP-OCRv3", "ch_ppocr_mobile_v2.0_cls_train.onnx")
    ocr_options = RapidOcrOptions(
        det_model_path=det_model_path,
        rec_model_path=rec_model_path,
        cls_model_path=cls_model_path,
    )
    pipeline_options = PdfPipelineOptions(ocr_options=ocr_options)
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
        },
    )

    for root, _, files in os.walk(directory_path):
        for fname in files:
            if any(fname.lower().endswith(ext) for ext in extensions):
                path = os.path.join(root, fname)
                try:
                    if fname.lower().endswith(".pdf"):
                        conversion_result: ConversionResult = converter.convert(source=path)
                        doc = conversion_result.document
                        content = doc.export_to_markdown()
                        if content:
                            docs.append(Document(page_content=content, metadata={"source": path}))
                    else:
                        with open(path, "r", encoding="utf-8") as f:
                            text = f.read().strip()
                        if text:
                            docs.append(Document(page_content=text, metadata={"source": path}))
                except Exception as e:
                    print(f"Failed to load {path}: {e}")
    return docs

def preprocess_documents(
    docs: List[Document], chunk_size: int = 800, chunk_overlap: int = 400
) -> List[Document]:
    """
    Preprocess documents: chunk, normalize and enrich with metadata.
    Designed for textbooks and structured content.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "],
        length_function=len,
    )

    chunked_docs: List[Document] = []
    for doc in docs:
        chunks = text_splitter.split_text(doc.page_content)
        for idx, chunk in enumerate(chunks):
            metadata = dict(doc.metadata)
            metadata.update({
                "chunk_id": str(uuid.uuid4()),
                "chunk_index": idx
            })
            chunked_docs.append(Document(page_content=chunk, metadata=metadata))
    return chunked_docs


def build_qdrant_index(
    docs: List[Document],
    qdrant_url: str = "http://localhost:6333",
    api_key: Optional[str] = None,
    collection_name: str = "rag_collection",
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
    vector_size: int = 384,
    distance: str = "Cosine",
    replica_count: int = 1,
    shard_number: int = 1
) -> QdrantVectorStore:
    """
    Build or overwrite a Qdrant collection and index the provided documents.
    Includes document preprocessing (chunking).
    """
    processed_docs = preprocess_documents(docs)

    embeddings = HuggingFaceEmbeddings(model_name=embedding_model)

    client = QdrantClient(
        url=qdrant_url,
        api_key=api_key,
        prefer_grpc=False,
    )

    if client.collection_exists(collection_name):
        client.delete_collection(collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=q_models.VectorParams(
            size=vector_size,
            distance=getattr(q_models.Distance, distance.upper())
        ),
        replication_factor=replica_count,
        shard_number=shard_number,
    )

    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
    )

    vectorstore.add_documents(processed_docs)
    return vectorstore


def query_qdrant(
    vectorstore: QdrantVectorStore,
    query_text: str,
    top_k: int = 3
):
    """
    Perform a similarity search on the Qdrant vectorstore.
    """
    results = vectorstore.similarity_search(query_text, k=top_k)
    print("\nTop Results:\n" + "="*30)
    for idx, doc in enumerate(results):
        print(f"Result #{idx + 1}")
        print("Source:", doc.metadata.get("source"))
        print("Chunk Index:", doc.metadata.get("chunk_index"))
        print("Content:\n", doc.page_content, "...\n")



if __name__ == "__main__":
    # Set directory path directly (edit this as needed)
    directory = "data"
    print(f"Loading documents from: {directory}")
    documents = load_documents_from_directory(directory)
    print(documents[0].page_content)
    # print(f"Loaded {len(documents)} documents. Indexing...")

    # vectorstore = build_qdrant_index(documents)
    # print("Indexing complete. Qdrant collection is ready.")

    # Simple test query
    # test_query = "Chuyển động cơ của một vật là gì?"
    # test_query = "What is great firewall?"
    # test_query = "Tường lửa vĩ đại là gì?"
    # test_query = "Phần nội dung buổi học gồm gì"
    # test_query = "Cấu trúc của một bài học"

    # print(f"\nQuerying: '{test_query}'")
    # query_qdrant(vectorstore, test_query)
