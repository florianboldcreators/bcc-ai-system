#!/usr/bin/env python3
"""
BCC AI Fact Extraction Pipeline
Inspired by NUTZ/Kagan's approach

Extracts discrete facts from Slack messages and categorizes them.
"""

import json
import os
from pathlib import Path
from datetime import datetime

# Categories adapted from NUTZ for BCC roles
CATEGORIES = {
    "background": "Who they are, experience, personal info",
    "clients": "Client-specific knowledge (Hisense, Gorenje, SIXT, etc.)",
    "frameworks": "How they approach work, methodologies",
    "quality_bars": "What 'good enough' means, standards",
    "style": "Communication patterns, tone, language",
    "tools": "Software, processes, workflows",
    "relationships": "Team dynamics, who they work with",
    "opinions": "Strong views, preferences, beliefs"
}

def load_slack_data(filepath: str, limit: int = None) -> list:
    """Load Slack messages from JSON export."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    messages = []
    
    # Handle different structures
    if isinstance(data, dict):
        if 'channels' in data:
            for channel, msgs in data['channels'].items():
                for msg in msgs[:limit] if limit else msgs:
                    if msg.get('text'):
                        messages.append({
                            'channel': channel,
                            'date': msg.get('date', ''),
                            'text': msg['text']
                        })
        elif 'dms' in data:
            for dm_id, msgs in data['dms'].items():
                for msg in msgs[:limit] if limit else msgs:
                    if msg.get('text'):
                        messages.append({
                            'channel': dm_id,
                            'date': msg.get('date', ''),
                            'text': msg['text']
                        })
    elif isinstance(data, list):
        for msg in data[:limit] if limit else data:
            if msg.get('text'):
                messages.append(msg)
    
    return messages

def create_extraction_prompt(messages: list, person_name: str = "Julia Hopper") -> str:
    """Create a prompt for Claude to extract facts."""
    
    messages_text = "\n\n".join([
        f"[{m.get('date', 'unknown')}] {m['text']}" 
        for m in messages[:50]  # Process in batches
    ])
    
    prompt = f"""Analyze these Slack messages from {person_name} and extract discrete facts about them.

MESSAGES:
{messages_text}

---

Extract facts in these categories:
1. BACKGROUND - Personal info, experience, role
2. CLIENTS - Client-specific knowledge (Hisense, Gorenje, SIXT, etc.)
3. FRAMEWORKS - How they approach work, methodologies
4. QUALITY_BARS - What "good enough" means, their standards
5. STYLE - Communication patterns, tone, how they write
6. TOOLS - Software, processes they use
7. RELATIONSHIPS - Who they work with, team dynamics
8. OPINIONS - Strong views, preferences

RULES:
- Each fact should be ONE discrete statement
- Be specific, not generic
- Include context when relevant
- Skip small talk / scheduling noise
- Focus on insights that would help recreate their work style

OUTPUT FORMAT (JSON):
{{
  "background": ["fact1", "fact2"],
  "clients": ["fact1", "fact2"],
  "frameworks": ["fact1", "fact2"],
  "quality_bars": ["fact1", "fact2"],
  "style": ["fact1", "fact2"],
  "tools": ["fact1", "fact2"],
  "relationships": ["fact1", "fact2"],
  "opinions": ["fact1", "fact2"]
}}

Extract facts now:"""
    
    return prompt


def sample_messages(filepath: str, n: int = 100) -> list:
    """Get a representative sample of messages."""
    messages = load_slack_data(filepath)
    
    # Filter out very short messages and noise
    meaningful = [
        m for m in messages 
        if len(m.get('text', '')) > 30 
        and not m['text'].startswith('<@')  # Skip pure mentions
        and 'joined the channel' not in m['text']
    ]
    
    # Take evenly distributed sample
    step = max(1, len(meaningful) // n)
    sample = meaningful[::step][:n]
    
    return sample


if __name__ == "__main__":
    # Test with sample
    base_path = Path("/Users/florian/.openclaw/workspace/julia-hopper-export/upload-package")
    
    print("Loading Julia Hopper Slack data...")
    sample = sample_messages(base_path / "julia_channel_data.json", n=50)
    
    print(f"Got {len(sample)} meaningful messages")
    print("\nSample messages:")
    for msg in sample[:5]:
        print(f"  - {msg['text'][:100]}...")
    
    print("\n\nGenerating extraction prompt...")
    prompt = create_extraction_prompt(sample)
    
    # Save prompt for manual testing
    output_path = Path("/Users/florian/.openclaw/workspace/bcc-ai-system/fact-extraction")
    output_path.mkdir(parents=True, exist_ok=True)
    
    with open(output_path / "sample_prompt.txt", 'w') as f:
        f.write(prompt)
    
    print(f"Prompt saved to {output_path / 'sample_prompt.txt'}")
    print(f"Prompt length: {len(prompt)} chars")
