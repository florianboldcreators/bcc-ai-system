#!/usr/bin/env python3
"""
BCC Creative Lead — RAG Knowledge Base Ingestion Pipeline

Reads files from knowledge-base/raw_data/ and references/, chunks them,
embeds with SentenceTransformers, and stores in a local JSON+numpy vector store.

Usage:
    python ingest_rag.py                      # Ingest all files
    python ingest_rag.py --collection briefs  # Ingest specific collection
    python ingest_rag.py --reset              # Clear DB and re-ingest
    python ingest_rag.py --stats              # Show DB statistics

Dependencies:
    pip install sentence-transformers numpy
"""

import os
import re
import sys
import json
import hashlib
import argparse
import pickle
from pathlib import Path
from datetime import datetime
from typing import Optional

import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
except ImportError:
    HAS_ST = False

# --- Configuration ---
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
KB_DIR = PROJECT_ROOT / "knowledge-base"
RAW_DIR = KB_DIR / "raw_data"
VECTOR_DIR = KB_DIR / "vector_db"
REFERENCES_DIR = PROJECT_ROOT / "references"

CHAR_CHUNK_SIZE = 3200  # ~800 tokens
CHAR_OVERLAP = 400      # ~100 tokens

DB_EMBEDDINGS_FILE = VECTOR_DIR / "embeddings.npy"
DB_METADATA_FILE = VECTOR_DIR / "metadata.json"

# --- Embedding Model ---
_model = None

def get_embedding_model():
    global _model
    if _model is None:
        if not HAS_ST:
            raise RuntimeError("sentence-transformers not installed")
        print("Loading embedding model (all-MiniLM-L6-v2)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model loaded.")
    return _model


# --- YAML Frontmatter Parser ---
def parse_frontmatter(text: str) -> tuple[dict, str]:
    metadata = {}
    body = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            frontmatter = parts[1].strip()
            body = parts[2].strip()
            for line in frontmatter.split("\n"):
                line = line.strip()
                if ":" in line:
                    key, _, value = line.partition(":")
                    key = key.strip()
                    value = value.strip()
                    if value.startswith("[") and value.endswith("]"):
                        value = value[1:-1]
                        value = ", ".join(v.strip().strip("'\"") for v in value.split(","))
                    metadata[key] = value
    return metadata, body


# --- Chunking ---
def chunk_text(text: str, chunk_size: int = CHAR_CHUNK_SIZE,
               overlap: int = CHAR_OVERLAP) -> list[str]:
    if len(text) <= chunk_size:
        return [text.strip()] if text.strip() else []

    chunks = []
    # Try heading splits first
    heading_splits = re.split(r'(?=\n#{1,3}\s)', text)
    if len(heading_splits) > 1 and all(len(s) <= chunk_size for s in heading_splits):
        return [s.strip() for s in heading_splits if s.strip()]

    # Paragraph splitting with overlap
    paragraphs = text.split("\n\n")
    current_chunk = ""
    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk += ("\n\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = current_chunk[-overlap:] + "\n\n" + para if overlap > 0 else para
            else:
                # Sentence split for oversized paragraphs
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sent in sentences:
                    if len(current_chunk) + len(sent) + 1 <= chunk_size:
                        current_chunk += (" " if current_chunk else "") + sent
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sent
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return chunks


# --- File Processing ---
def process_file(filepath: Path) -> list[dict]:
    text = filepath.read_text(encoding="utf-8")
    metadata, body = parse_frontmatter(text)
    if not body.strip():
        return []

    # Determine category
    if RAW_DIR in filepath.parents:
        relative = filepath.relative_to(RAW_DIR)
    elif REFERENCES_DIR in filepath.parents:
        relative = filepath.relative_to(REFERENCES_DIR)
    else:
        relative = filepath.relative_to(PROJECT_ROOT)
    category = relative.parts[0] if len(relative.parts) > 1 else "general"

    base_meta = {
        "source_file": str(filepath.name),
        "source_path": str(relative),
        "category": category,
        "ingested_at": datetime.now().isoformat(),
    }
    for key, value in metadata.items():
        if key not in ("synthetic",):
            base_meta[key] = str(value)

    chunks = chunk_text(body)
    results = []
    for i, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{filepath}:{i}:{chunk[:100]}".encode()).hexdigest()
        chunk_meta = {**base_meta, "chunk_index": i, "total_chunks": len(chunks)}
        results.append({"id": chunk_id, "text": chunk, "metadata": chunk_meta})
    return results


def collect_all_files() -> list[Path]:
    files = []
    if RAW_DIR.exists():
        for ext in ("*.md", "*.txt"):
            files.extend(RAW_DIR.rglob(ext))
    if REFERENCES_DIR.exists():
        for ext in ("*.md", "*.txt"):
            files.extend(REFERENCES_DIR.rglob(ext))
    files = [f for f in files if f.stat().st_size > 50 and f.name != ".gitkeep"]
    return sorted(files)


# --- Vector Store Operations ---
class VectorStore:
    def __init__(self, vector_dir: Path = VECTOR_DIR):
        self.vector_dir = vector_dir
        self.embeddings = None  # numpy array (N x D)
        self.metadata = []      # list of dicts
        self.texts = []          # list of strings
        self.ids = []            # list of chunk IDs

    def load(self):
        if DB_EMBEDDINGS_FILE.exists() and DB_METADATA_FILE.exists():
            self.embeddings = np.load(str(DB_EMBEDDINGS_FILE))
            with open(DB_METADATA_FILE, "r") as f:
                data = json.load(f)
            self.metadata = data["metadata"]
            self.texts = data["texts"]
            self.ids = data["ids"]
        else:
            self.embeddings = None
            self.metadata = []
            self.texts = []
            self.ids = []

    def save(self):
        self.vector_dir.mkdir(parents=True, exist_ok=True)
        if self.embeddings is not None:
            np.save(str(DB_EMBEDDINGS_FILE), self.embeddings)
        with open(DB_METADATA_FILE, "w") as f:
            json.dump({"metadata": self.metadata, "texts": self.texts, "ids": self.ids},
                      f, ensure_ascii=False, indent=2)

    def add(self, ids: list, texts: list, embeddings: np.ndarray, metadatas: list):
        if self.embeddings is None:
            self.embeddings = embeddings
        else:
            self.embeddings = np.vstack([self.embeddings, embeddings])
        self.ids.extend(ids)
        self.texts.extend(texts)
        self.metadata.extend(metadatas)

    def reset(self):
        self.embeddings = None
        self.metadata = []
        self.texts = []
        self.ids = []
        if DB_EMBEDDINGS_FILE.exists():
            DB_EMBEDDINGS_FILE.unlink()
        if DB_METADATA_FILE.exists():
            DB_METADATA_FILE.unlink()

    def query(self, query_embedding: np.ndarray, top_k: int = 3,
              client_filter: str = None, category_filter: str = None) -> list[dict]:
        if self.embeddings is None or len(self.ids) == 0:
            return []

        # Cosine similarity
        query_norm = query_embedding / np.linalg.norm(query_embedding)
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1
        normed = self.embeddings / norms
        similarities = normed @ query_norm

        # Apply filters
        mask = np.ones(len(self.ids), dtype=bool)
        if client_filter:
            mask &= np.array([m.get("client", "").lower() == client_filter.lower() for m in self.metadata])
        if category_filter:
            mask &= np.array([m.get("category", "").lower() == category_filter.lower() for m in self.metadata])

        filtered_sims = np.where(mask, similarities, -1)
        top_indices = np.argsort(filtered_sims)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if filtered_sims[idx] <= 0:
                continue
            results.append({
                "text": self.texts[idx],
                "metadata": self.metadata[idx],
                "similarity": float(filtered_sims[idx]),
            })
        return results

    @property
    def count(self):
        return len(self.ids)


# --- Main Pipeline ---
def ingest(reset: bool = False, collection_filter: Optional[str] = None):
    store = VectorStore()

    if reset:
        store.reset()
        print("Reset vector store.")
    else:
        store.load()

    model = get_embedding_model()
    files = collect_all_files()

    if collection_filter:
        files = [f for f in files if collection_filter in str(f)]

    print(f"\nFound {len(files)} files to ingest")
    total_chunks = 0

    for filepath in files:
        chunks = process_file(filepath)
        if not chunks:
            continue

        # Skip already-ingested chunks
        new_chunks = [c for c in chunks if c["id"] not in set(store.ids)]
        if not new_chunks:
            print(f"  ⏭️  {filepath.name}: already ingested")
            continue

        texts = [c["text"] for c in new_chunks]
        ids = [c["id"] for c in new_chunks]
        metadatas = [c["metadata"] for c in new_chunks]

        embeddings = model.encode(texts)
        store.add(ids, texts, embeddings, metadatas)

        total_chunks += len(new_chunks)
        print(f"  ✅ {filepath.name}: {len(new_chunks)} chunks")

    store.save()

    print(f"\n{'='*50}")
    print(f"Ingestion complete!")
    print(f"Files processed: {len(files)}")
    print(f"New chunks: {total_chunks}")
    print(f"Total in store: {store.count}")
    print(f"DB location: {VECTOR_DIR}")
    print(f"{'='*50}")


def show_stats():
    store = VectorStore()
    store.load()

    print(f"\n📊 Vector Store Statistics")
    print(f"Total chunks: {store.count}")
    print(f"DB location: {VECTOR_DIR}")

    if store.count > 0:
        categories = set(m.get("category", "") for m in store.metadata)
        clients = set(m.get("client", "") for m in store.metadata if m.get("client"))
        print(f"Categories: {', '.join(sorted(categories))}")
        if clients:
            print(f"Clients: {', '.join(sorted(clients))}")
        print(f"Embedding dimensions: {store.embeddings.shape[1]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BCC RAG Knowledge Base Ingestion")
    parser.add_argument("--reset", action="store_true", help="Clear DB and re-ingest")
    parser.add_argument("--collection", type=str, help="Filter files by path substring")
    parser.add_argument("--stats", action="store_true", help="Show DB statistics")
    args = parser.parse_args()

    if args.stats:
        show_stats()
    else:
        ingest(reset=args.reset, collection_filter=args.collection)
