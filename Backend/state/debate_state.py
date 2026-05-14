import operator
from typing import TypedDict, Dict, List, Any, Optional, Annotated
from datetime import datetime


def deep_merge(dict1: dict, dict2: dict) -> dict:
    """
    Deep merge two dictionaries.
    Essential for LangGraph when multiple nodes write to the same key simultaneously.
    If both are dicts, it merges keys recursively.
    Otherwise, dict2 overwrites dict1.
    """
    result = dict1.copy() if isinstance(dict1, dict) else {}
    if not isinstance(dict2, dict):
        return dict2
    
    for k, v in dict2.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = v
    return result


class StreamingEvent(TypedDict, total=False):
    event_type: str
    timestamp: str
    round_number: int
    agent_type: str
    agent_id: str
    content: str
    metadata: Dict[str, Any]


class AgentExecution(TypedDict, total=False):
    agent_id: str
    agent_name: str
    role: str
    round_number: int
    status: str
    started_at: str
    completed_at: str
    raw_response: str
    parsed_output: Dict[str, Any]
    confidence_score: float
    execution_time_seconds: float
    token_usage: Dict[str, Any]
    error: Optional[str]


class ModeratorState(TypedDict, total=False):
    started_at: str
    completed_at: str
    status: str
    raw_response: str
    parsed_output: Dict[str, Any]
    confidence_score: float
    execution_time_seconds: float
    token_usage: Dict[str, Any]
    error: Optional[str]


class DebateMetrics(TypedDict, total=False):
    total_execution_time_seconds: float
    total_input_tokens: int
    total_output_tokens: int
    total_agents_executed: int
    failed_agents: List[str]
    warnings: List[str]


class DebateState(TypedDict, total=False):
    # ------------------------------------------------
    # SESSION METADATA (Sequential)
    # ------------------------------------------------
    session_id: str
    status: str
    current_phase: str
    current_round: int
    created_at: str
    updated_at: str
    completed_at: Optional[str]

    # ------------------------------------------------
    # INPUTS
    # ------------------------------------------------
    file_paths: List[str]
    vendor_names: List[str]

    # ------------------------------------------------
    # ROUND 0 INTELLIGENCE (Sequential)
    # ------------------------------------------------
    intelligence: Dict[str, Any]

    # ------------------------------------------------
    # PARALLEL MERGED KEYS
    # Using deep_merge so multiple agents writing to 
    # the same dict don't overwrite each other
    # ------------------------------------------------
    rounds: Annotated[Dict[str, Any], deep_merge]
    customer: Annotated[Dict[str, Any], deep_merge]
    adversarial: Annotated[Dict[str, Any], deep_merge]

    # ------------------------------------------------
    # FINAL MODERATOR OUTPUT (Sequential)
    # ------------------------------------------------
    moderator: ModeratorState

    # ------------------------------------------------
    # LIST CONCATENATION KEYS
    # Using operator.add to append items concurrently
    # ------------------------------------------------
    event_log: Annotated[List[StreamingEvent], operator.add]
    errors: Annotated[List[str], operator.add]
    warnings: Annotated[List[str], operator.add]

    # ------------------------------------------------
    # BIAS + RISK TRACKING (Merged)
    # ------------------------------------------------
    bias_scores: Annotated[Dict[str, float], deep_merge]
    risk_scores: Annotated[Dict[str, float], deep_merge]

    # ------------------------------------------------
    # EXECUTION METRICS (Sequential at end)
    # ------------------------------------------------
    metrics: DebateMetrics