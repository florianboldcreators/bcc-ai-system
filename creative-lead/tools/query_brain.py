#!/usr/bin/env python3
"""
BCC Creative Lead — Knowledge Base Query Tool

Searches the local vector store for relevant context.
Designed to be called by the Creative Lead agent during Steps 0-2.

Usage:
    python query_brain.py "What is the brand voice for SIXT?"
    python query_brain.py "trending formats for kitchen appliances" --top 5
    python query_brain.py "Gorenje retro collection" --client Gorenje
    
    # As Python module
    from tools.query_brain import query_brain
    results = query_brain("brand voice for Porsche", top_k=3)
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

# --- Configuration ---
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
KB_DIR = PROJECT_ROOT / "knowledge-base"
VECTOR_DIR = KB_DIR / "vector_db"
DB_EMBEDDINGS_FILE = VECTOR_DIR / "embeddings.npy"
DB_METADATA_FILE = VECTOR_DIR / "metadata.json"

_model = None

def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def query_brain(
    query: str,
    top_k: int = 3,
    client_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
) -> list[dict]:
    """
    Search the BCC Knowledge Base for relevant context.
    
    Args:
        query: Natural language search query
        top_k: Number of results to return
        client_filter: Filter by client name
        category_filter: Filter by category
    
    Returns:
        List of dicts with keys: text, metadata, similarity, relevance
    """
    if not DB_EMBEDDINGS_FILE.exists() or not DB_METADATA_FILE.exists():
        return [{"error": "Knowledge base not initialized. Run: python scripts/ingest_rag.py"}]
    
    embeddings = np.load(str(DB_EMBEDDINGS_FILE))
    with open(DB_METADATA_FILE, "r") as f:
        data = json.load(f)
    
    metadata_list = data["metadata"]
    texts = data["texts"]
    ids = data["ids"]
    
    # Embed query
    model = _get_model()
    query_emb = model.encode(query)
    
    # Cosine similarity
    query_norm = query_emb / np.linalg.norm(query_emb)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1
    normed = embeddings / norms
    similarities = normed @ query_norm
    
    # Apply filters
    mask = np.ones(len(ids), dtype=bool)
    if client_filter:
        mask &= np.array([m.get("client", "").lower() == client_filter.lower() for m in metadata_list])
    if category_filter:
        mask &= np.array([m.get("category", "").lower() == category_filter.lower() for m in metadata_list])
    
    filtered_sims = np.where(mask, similarities, -1)
    top_indices = np.argsort(filtered_sims)[::-1][:top_k]
    
    results = []
    for idx in top_indices:
        if filtered_sims[idx] <= 0:
            continue
        results.append({
            "text": texts[idx],
            "metadata": metadata_list[idx],
            "similarity": float(filtered_sims[idx]),
            "relevance": round(float(filtered_sims[idx]), 3),
        })
    return results


def format_for_agent(results: list[dict]) -> str:
    """Format query results as context for the Creative Lead agent."""
    if not results or "error" in results[0]:
        return "⚠️ No relevant context found in the knowledge base."
    
    lines = ["## 🧠 Knowledge Base Context\n"]
    for i, r in enumerate(results, 1):
        meta = r["metadata"]
        source = meta.get("source_file", "unknown")
        client = meta.get("client", "")
        category = meta.get("category", "")
        relevance = r.get("relevance", 0)
        
        lines.append(f"### Result {i} (relevance: {relevance:.0%})")
        parts = []
        if client:
            parts.append(f"**Client:** {client}")
        parts.append(f"**Source:** {source}")
        parts.append(f"**Category:** {category}")
        lines.append(" | ".join(parts))
        lines.append(f"\n{r['text'][:1500]}\n")
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Query the BCC Knowledge Base")
    parser.add_argument("query", type=str, help="Natural language search query")
    parser.add_argument("--top", type=int, default=3, help="Number of results")
    parser.add_argument("--client", type=str, help="Filter by client name")
    parser.add_argument("--category", type=str, help="Filter by category")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--agent", action="store_true", help="Format for agent injection")
    args = parser.parse_args()
    
    results = query_brain(args.query, top_k=args.top, client_filter=args.client, category_filter=args.category)
    
    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    elif args.agent:
        print(format_for_agent(results))
    else:
        for i, r in enumerate(results, 1):
            print(f"\n{'='*60}")
            print(f"Result {i} (relevance: {r.get('relevance', 'N/A')})")
            print(f"Source: {r['metadata'].get('source_file', 'unknown')}")
            if r['metadata'].get('client'):
                print(f"Client: {r['metadata']['client']}")
            print(f"{'='*60}")
            print(r["text"][:800])
