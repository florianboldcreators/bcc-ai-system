#!/usr/bin/env python3
"""
BCC AI System — Telemetry & Resilience Layer

Centralized logging, error handling with exponential backoff,
circuit breakers, and Telegram alerting for system faults.

Usage:
    from telemetry import get_logger, resilient_call, alert_system_fault

    logger = get_logger("creative-lead")
    logger.info("Brief ingested", extra={"client": "Porsche"})
    
    result = resilient_call(my_api_function, args, max_retries=3)
"""

import os
import sys
import time
import json
import logging
import traceback
import urllib.request
from pathlib import Path
from datetime import datetime
from functools import wraps

# --- Configuration ---
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_LOG = LOG_DIR / "system_audit.log"
METRICS_FILE = LOG_DIR / "metrics.json"

# Telegram alert config (uses OpenClaw message tool, not direct API)
ALERT_ENABLED = True


# --- Logging Setup ---

class BccFormatter(logging.Formatter):
    """Custom formatter with emoji prefixes."""
    FORMATS = {
        logging.DEBUG: "🔍 %(asctime)s [DEBUG] %(name)s: %(message)s",
        logging.INFO: "📋 %(asctime)s [INFO] %(name)s: %(message)s",
        logging.WARNING: "⚠️  %(asctime)s [WARN] %(name)s: %(message)s",
        logging.ERROR: "❌ %(asctime)s [ERROR] %(name)s: %(message)s",
        logging.CRITICAL: "🚨 %(asctime)s [CRITICAL] %(name)s: %(message)s",
    }

    def format(self, record):
        fmt = self.FORMATS.get(record.levelno, self.FORMATS[logging.INFO])
        formatter = logging.Formatter(fmt, datefmt="%Y-%m-%d %H:%M:%S")
        return formatter.format(record)


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger that writes to both file and stderr."""
    logger = logging.getLogger(f"bcc.{name}")
    if logger.handlers:
        return logger  # Already configured
    
    logger.setLevel(logging.DEBUG)
    
    # File handler (audit log)
    fh = logging.FileHandler(AUDIT_LOG, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(BccFormatter())
    logger.addHandler(fh)
    
    # Console handler
    ch = logging.StreamHandler(sys.stderr)
    ch.setLevel(logging.INFO)
    ch.setFormatter(BccFormatter())
    logger.addHandler(ch)
    
    return logger


# --- Resilience ---

def resilient_call(func, *args, max_retries: int = 3,
                   base_delay: float = 2.0, max_delay: float = 30.0,
                   logger_name: str = "resilience", **kwargs):
    """
    Call a function with exponential backoff retry logic.
    
    Args:
        func: Function to call
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay cap in seconds
    
    Returns:
        Function result or None if all retries exhausted
    """
    logger = get_logger(logger_name)
    
    for attempt in range(1, max_retries + 1):
        try:
            result = func(*args, **kwargs)
            if attempt > 1:
                logger.info(f"Succeeded on attempt {attempt}/{max_retries}")
            return result
        except KeyboardInterrupt:
            raise
        except Exception as e:
            delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
            
            if attempt < max_retries:
                logger.warning(
                    f"Attempt {attempt}/{max_retries} failed: {e}. "
                    f"Retrying in {delay:.1f}s..."
                )
                time.sleep(delay)
            else:
                logger.error(
                    f"All {max_retries} attempts failed: {e}",
                    exc_info=True
                )
                return None
    
    return None


class CircuitBreaker:
    """
    Circuit breaker pattern for external services.
    
    States:
        CLOSED: Normal operation, calls pass through
        OPEN: Service is down, calls fail immediately
        HALF_OPEN: Testing if service recovered
    """
    
    def __init__(self, name: str, failure_threshold: int = 3,
                 recovery_timeout: float = 60.0):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time = 0
        self.state = "CLOSED"
        self.logger = get_logger(f"circuit.{name}")
    
    def call(self, func, *args, **kwargs):
        """Execute function through circuit breaker."""
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                self.logger.info(f"Circuit {self.name}: HALF_OPEN (testing recovery)")
            else:
                self.logger.warning(f"Circuit {self.name}: OPEN (call rejected)")
                return None
        
        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failures = 0
                self.logger.info(f"Circuit {self.name}: CLOSED (recovered)")
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            
            if self.failures >= self.failure_threshold:
                self.state = "OPEN"
                self.logger.error(
                    f"Circuit {self.name}: OPEN after {self.failures} failures. "
                    f"Last error: {e}"
                )
            else:
                self.logger.warning(
                    f"Circuit {self.name}: failure {self.failures}/{self.failure_threshold}: {e}"
                )
            raise


# Circuit breakers for external services
asana_breaker = CircuitBreaker("asana", failure_threshold=3, recovery_timeout=120)
claude_breaker = CircuitBreaker("claude", failure_threshold=3, recovery_timeout=60)
telegram_breaker = CircuitBreaker("telegram", failure_threshold=5, recovery_timeout=30)


# --- Metrics ---

def load_metrics() -> dict:
    """Load or initialize metrics."""
    if METRICS_FILE.exists():
        return json.loads(METRICS_FILE.read_text())
    return {
        "created": datetime.now().isoformat(),
        "concepts_generated": 0,
        "concepts_passed": 0,
        "concepts_revised": 0,
        "concepts_rejected": 0,
        "quality_loop_retries": 0,
        "approvals": 0,
        "golden_examples": 0,
        "api_errors": 0,
        "avg_score": 0,
        "total_score_sum": 0,
        "total_scored": 0,
        "briefs_processed": 0,
    }


def save_metrics(metrics: dict):
    """Save metrics to file."""
    metrics["last_updated"] = datetime.now().isoformat()
    METRICS_FILE.write_text(json.dumps(metrics, indent=2))


def track_event(event: str, data: dict = None):
    """Track a system event in metrics."""
    metrics = load_metrics()
    
    if event == "concept_generated":
        metrics["concepts_generated"] += data.get("count", 3)
    elif event == "concept_scored":
        score = data.get("score", 0)
        verdict = data.get("verdict", "")
        metrics["total_score_sum"] += score
        metrics["total_scored"] += 1
        metrics["avg_score"] = round(metrics["total_score_sum"] / metrics["total_scored"], 2)
        if verdict == "PASS":
            metrics["concepts_passed"] += 1
        elif verdict == "REVISE":
            metrics["concepts_revised"] += 1
        elif verdict == "REJECT":
            metrics["concepts_rejected"] += 1
    elif event == "quality_loop_retry":
        metrics["quality_loop_retries"] += 1
    elif event == "approval":
        metrics["approvals"] += 1
    elif event == "golden_example":
        metrics["golden_examples"] += 1
    elif event == "api_error":
        metrics["api_errors"] += 1
    elif event == "brief_processed":
        metrics["briefs_processed"] += 1
    
    save_metrics(metrics)


def get_metrics_summary() -> str:
    """Get a human-readable metrics summary."""
    m = load_metrics()
    pass_rate = (m["concepts_passed"] / m["total_scored"] * 100) if m["total_scored"] else 0
    
    return f"""📊 **BCC AI System Metrics**
📝 Briefs processed: {m['briefs_processed']}
🎨 Concepts generated: {m['concepts_generated']}
⚖️ Concepts scored: {m['total_scored']}
✅ Pass rate: {pass_rate:.0f}%
📈 Avg score: {m['avg_score']}/5
🔄 Auto-retries: {m['quality_loop_retries']}
👍 CEO approvals: {m['approvals']}
🧠 Golden examples: {m['golden_examples']}
❌ API errors: {m['api_errors']}
🕐 Last updated: {m.get('last_updated', 'never')}"""


# --- System Fault Alert ---

def alert_system_fault(error_msg: str, component: str = "unknown"):
    """
    Send a critical system fault alert to Florian via Telegram.
    This is the last resort when the system cannot self-heal.
    """
    logger = get_logger("alert")
    logger.critical(f"SYSTEM FAULT in {component}: {error_msg}")
    
    alert_text = (
        f"🚨 **SYSTEM FAULT — {component.upper()}**\n\n"
        f"```\n{error_msg[:500]}\n```\n\n"
        f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"🔧 Das System konnte den Fehler nicht selbst beheben.\n"
        f"💡 Sag mir 'system status' für Details."
    )
    
    # Write to fault log
    fault_log = LOG_DIR / "faults.log"
    with open(fault_log, "a") as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"FAULT: {datetime.now().isoformat()} | {component}\n")
        f.write(f"{error_msg}\n")
        f.write(f"{'='*60}\n")
    
    # The actual Telegram sending is done by the calling agent (James/OpenClaw)
    # We output a structured alert that the agent can pick up
    print(f"SYSTEM_FAULT_ALERT:{json.dumps({'component': component, 'error': error_msg[:500], 'alert_text': alert_text})}")
    
    return alert_text
