import os
import uuid
import torch
import hashlib
from typing import List, Optional
from huggingface_hub import snapshot_download

from langchain.schema import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain.text_splitter import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import PyMuPDFLoader, PDFMinerLoader  

from qdrant_client import QdrantClient
from qdrant_client.http import models as q_models

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (PdfPipelineOptions, EasyOcrOptions,TesseractOcrOptions, RapidOcrOptions, smolvlm_picture_description, TableFormerMode)
from docling.document_converter import (
    ConversionResult,
    DocumentConverter,
    InputFormat,
    PdfFormatOption,
)

def tcvn3_to_unicode(vnstr):
    tcvn3_unicode_map = {
        "¸": chr(225), "µ": chr(224), "¶": chr(7843), "·": chr(227), "¹": chr(7841),
        "¨": chr(259), "¾": chr(7855), "»": chr(7857), "¼": chr(7859), "½": chr(7861), 
        "Æ": chr(7863), "©": chr(226), "Ê": chr(7845), "Ç": chr(7847), "È": chr(7849), 
        "É": chr(7851), "Ë": chr(7853), "Ð": chr(233), "Ì": chr(232), "Î": chr(7867), 
        "Ï": chr(7869), "Ñ": chr(7865), "ª": chr(234), "Õ": chr(7871), "Ò": chr(7873), 
        "Ó": chr(7875), "Ô": chr(7877), "Ö": chr(7879), "ã": chr(243), "ß": chr(242), 
        "á": chr(7887), "â": chr(245), "ä": chr(7885), "«": chr(244), "è": chr(7889), 
        "å": chr(7891), "æ": chr(7893), "ç": chr(7895), "é": chr(7897), "¬": chr(417), 
        "í": chr(7899), "ê": chr(7901), "ë": chr(7903), "ì": chr(7905), "î": chr(7907),
        "Ý": chr(237), "×": chr(236), "Ø": chr(7881), "Ü": chr(297), "Þ": chr(7883),
        "ó": chr(250), "ï": chr(249), "ñ": chr(7911), "ò": chr(361), "ô": chr(7909),
        "­": chr(432), "ø": chr(7913), "õ": chr(7915), "ö": chr(7917), "÷": chr(7919), 
        "ù": chr(7921), "ý": chr(253), "ú": chr(7923), "û": chr(7927), "ü": chr(7929), 
        "þ": chr(7925), "®": chr(273), "ð": chr(432), "¡": chr(258), "¢": chr(194), 
        "£": chr(202), "¤": chr(212), "¥": chr(416), "¦": chr(431), "§": chr(272)
    }

    identity_map = {
        "a": "a", "e": "e", "i": "i", "o": "o", "u": "u", "y": "y",
        "A": "A", "E": "E", "I": "I", "O": "O", "U": "U", "Y": "Y"
    }

    tcvn3_unicode_map.update(identity_map)

    result = ""
    for c in vnstr:
        result += tcvn3_unicode_map.get(c, c) 
    return result

def get_hash(filepath: str) -> str:
    with open(filepath, 'rb') as f:
        file_bytes = f.read()
    return hashlib.md5(file_bytes).hexdigest()

def has_been_processed(path: str) -> bool:
    return os.path.exists(path)

def load_documents_from_directory(
    directory_path: str, extensions: Optional[List[str]] = None
) -> List[Document]:
    extensions = extensions or [".txt", ".md", ".pdf", ".png", ".docx"]
    docs: List[Document] = []

    raw_dir = os.path.join(directory_path, "raw")
    processed_dir = os.path.join(directory_path, "processed")
    os.makedirs(processed_dir, exist_ok=True)

    # print("Downloading RapidOCR models")
    # download_path = snapshot_download(repo_id="SWHL/RapidOCR")

    # det_model_path = os.path.join(download_path, "PP-OCRv4", "en_PP-OCRv3_det_infer.onnx")
    # rec_model_path = os.path.join(download_path, "PP-OCRv4", "ch_PP-OCRv4_rec_server_infer.onnx")
    # cls_model_path = os.path.join(download_path, "PP-OCRv3", "ch_ppocr_mobile_v2.0_cls_train.onnx")

    # ocr_options = RapidOcrOptions(
    #     det_model_path=det_model_path,
    #     rec_model_path=rec_model_path,
    #     cls_model_path=cls_model_path,
    # )

    pipeline_options = PdfPipelineOptions(do_ocr=False)
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
            InputFormat.IMAGE: ["jpg", "jpeg", "png", "tif", "tiff", "bmp"],
        },
    )

    for root, _, files in os.walk(raw_dir):
        for fname in files:
            if any(fname.lower().endswith(ext) for ext in extensions):
                raw_path = os.path.join(root, fname)
                rel_path = os.path.relpath(raw_path, raw_dir)
                base_name = os.path.splitext(rel_path)[0].replace(os.sep, "_")
                unicode_md_path = os.path.join(processed_dir, base_name + ".md")

                try:
                    if has_been_processed(unicode_md_path):
                        print(f"==> Skipping already processed: {fname}")
                        with open(unicode_md_path, "r", encoding="utf-8") as f:
                            unicode_text = f.read().strip()
                            if unicode_text:
                                docs.append(Document(page_content=unicode_text, metadata={"source": raw_path}))
                        continue

                    if fname.lower().endswith((".pdf", ".png", ".docx")):
                        conversion_result = converter.convert(source=raw_path)
                        doc = conversion_result.document.export_to_markdown()

                        if doc:
                            if fname.lower().endswith("_tcvn3.pdf") or fname.lower().endswith("_tcvn3.docx"):
                                unicode_text = tcvn3_to_unicode(doc)
                            else:
                                unicode_text = doc

                            with open(unicode_md_path, "w", encoding="utf-8") as f:
                                f.write(unicode_text)

                            docs.append(Document(page_content=unicode_text, metadata={"source": raw_path}))
                    else:
                        with open(raw_path, "r", encoding="utf-8") as f:
                            text = f.read().strip()
                        if text:
                            docs.append(Document(page_content=text, metadata={"source": raw_path}))
                except Exception as e:
                    print(f"Failed to load {raw_path}: {e}")

    return docs


def preprocess_documents(
    docs: List[Document], chunk_size: int = 800, chunk_overlap: int = 400
) -> List[Document]:
    """
    Preprocess documents using Markdown-aware splitting.
    Splits documents into semantically meaningful sections based on Markdown headers.
    """
    chunked_docs: List[Document] = []

    splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[
        ("#", "h1"),
        ("##", "h2"),
        ("###", "h3"),
        ("####", "h4"),
    ])

    for doc in docs:
        try:
            md_sections = splitter.split_text(doc.page_content)
            for idx, section in enumerate(md_sections):
                metadata = dict(doc.metadata)
                metadata.update({
                    "chunk_id": str(uuid.uuid4()),
                    "chunk_index": idx,
                    "header": section.metadata.get("header", "")
                })
                chunked_docs.append(Document(page_content=section.page_content, metadata=metadata))
        except Exception as e:
            print(f"Error while splitting document '{doc.metadata.get('source', '')}': {e}")

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
    processed_docs = preprocess_documents(docs)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    embeddings = HuggingFaceEmbeddings(model_name=embedding_model, model_kwargs={"device": device})
    client = QdrantClient(url=qdrant_url, api_key=api_key, prefer_grpc=False)

    if client.collection_exists(collection_name):
        print(f"Collection '{collection_name}' exists. Deleting for reset.")
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
    top_k: int = 4
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


import time

if __name__ == "__main__":
    # directory = "database"
    # print(f"Loading documents from: {directory}")
    # documents = load_documents_from_directory(directory)
    # print(f"Loaded {len(documents)} documents.")

    # print("Indexing...")
    # start_time = time.time()

    # vectorstore = build_qdrant_index(
    #     documents,
    #     embedding_model="thanhtantran/Vietnamese_Embedding_v2",
    #     vector_size=1024
    # )

    # end_time = time.time()
    # elapsed_seconds = end_time - start_time
    # elapsed_minutes = elapsed_seconds / 60

    # print(f"Indexing complete in {elapsed_minutes:.2f} minutes ({elapsed_seconds:.2f} seconds). Qdrant collection is ready.")

    vectorstore = QdrantVectorStore(
        client=QdrantClient(url="http://localhost:6333"),
        collection_name="rag_collection",
        embedding=HuggingFaceEmbeddings(model_name="thanhtantran/Vietnamese_Embedding_v2")
    )

    # Simple test query
    test_query = "Chuyển động thẳng biến đổi đều là gì?"

    print(f"\nQuerying: '{test_query}'")
    query_qdrant(vectorstore, test_query)

