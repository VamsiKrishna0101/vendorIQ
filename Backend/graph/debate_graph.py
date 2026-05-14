"""
graph/debate_graph.py

Constructs the LangGraph orchestration for the VendorIQ platform.
Sets up all stateless nodes, parallel branching, and round sequencing.
"""

from langgraph.graph import StateGraph, START, END
from state.debate_state import DebateState

# Import nodes
from nodes.analyst_node import analyst_node
from nodes.decision_node import make_decision_node
from nodes.customer_node import make_customer_node
from nodes.adversarial_node import make_adversarial_node
from nodes.moderator_node import moderator_node

# Define our agents
DECISION_AGENTS = ["cfo", "cto", "legal", "operations", "enterprise_arch", "procurement", "digital_lead"]
CUSTOMER_AGENTS = ["positive_rep", "negative_rep", "neutral_rep"]
ADVERSARIAL_AGENTS = ["devils_advocate", "bias_detector", "governance"]

def _join_node(state: DebateState) -> dict:
    """Dummy node used to join parallel branches."""
    return {}

def make_phase_change_node(next_round: int):
    """Creates a node that emits a phase_change event before continuing."""
    async def _phase_change(state: DebateState) -> dict:
        session_id = state.get("session_id", "unknown")
        from services.session_event_bus import event_bus
        from utils.db import SessionLocal
        from models.DebateEvent import DebateEvent
        from datetime import datetime
        
        phase_change_event = {
            "event_type": "phase_change",
            "round_number": next_round,
            "timestamp": datetime.utcnow().isoformat()
        }
        await event_bus.put_event(session_id, phase_change_event)
        
        # Persist to DB so replay includes phase transitions
        db = SessionLocal()
        try:
            db_event = DebateEvent(
                session_id=session_id,
                event_type="phase_change",
                agent_id="system",
                agent_type="system",
                round_number=next_round,
                content="phase_change",
                sequence_num=999900 + next_round
            )
            db.add(db_event)
            db.commit()
        finally:
            db.close()
        
        return {}
    
    _phase_change.__name__ = f"phase_change_to_r{next_round}"
    return _phase_change

def build_debate_graph():
    """Builds and compiles the main StateGraph."""
    workflow = StateGraph(DebateState)

    # ---------------------------------------------------------
    # 1. ADD ALL NODES
    # ---------------------------------------------------------
    
    workflow.add_node("analyst_node", analyst_node)
    
    # We use join nodes to synchronize parallel execution
    workflow.add_node("round1_join", _join_node)
    workflow.add_node("round1_adv_join", make_phase_change_node(2))
    
    workflow.add_node("round2_join", _join_node)
    workflow.add_node("round2_adv_join", make_phase_change_node(3))
    
    workflow.add_node("round3_join", _join_node)
    workflow.add_node("round3_adv_join", make_phase_change_node(4))

    workflow.add_node("moderator_node", moderator_node)

    # Register all dynamically generated nodes for each round
    for r in [1, 2, 3]:
        # Decision nodes run in all 3 rounds
        for agent in DECISION_AGENTS:
            node_name = f"decision_{agent}_r{r}"
            workflow.add_node(node_name, make_decision_node(agent, r))
            
        # Customer nodes only run in rounds 1 and 2
        if r in [1, 2]:
            for agent in CUSTOMER_AGENTS:
                node_name = f"customer_{agent}_r{r}"
                workflow.add_node(node_name, make_customer_node(agent, r))
                
        # Adversarial nodes run in all 3 rounds
        for agent in ADVERSARIAL_AGENTS:
            node_name = f"adversarial_{agent}_r{r}"
            workflow.add_node(node_name, make_adversarial_node(agent, r))

    # ---------------------------------------------------------
    # 2. DEFINE EDGES (SEQUENCING & PARALLELISM)
    # ---------------------------------------------------------
    
    # Start -> Analyst
    workflow.add_edge(START, "analyst_node")

    # --- ROUND 1 ---
    # Analyst -> Parallel Decision & Customer (Round 1)
    for agent in DECISION_AGENTS:
        workflow.add_edge("analyst_node", f"decision_{agent}_r1")
        workflow.add_edge(f"decision_{agent}_r1", "round1_join")
        
    for agent in CUSTOMER_AGENTS:
        workflow.add_edge("analyst_node", f"customer_{agent}_r1")
        workflow.add_edge(f"customer_{agent}_r1", "round1_join")
        
    # Join -> Parallel Adversarial (Round 1)
    for agent in ADVERSARIAL_AGENTS:
        workflow.add_edge("round1_join", f"adversarial_{agent}_r1")
        workflow.add_edge(f"adversarial_{agent}_r1", "round1_adv_join")

    # --- ROUND 2 ---
    # Adv Join 1 -> Parallel Decision & Customer (Round 2)
    for agent in DECISION_AGENTS:
        workflow.add_edge("round1_adv_join", f"decision_{agent}_r2")
        workflow.add_edge(f"decision_{agent}_r2", "round2_join")
        
    for agent in CUSTOMER_AGENTS:
        workflow.add_edge("round1_adv_join", f"customer_{agent}_r2")
        workflow.add_edge(f"customer_{agent}_r2", "round2_join")
        
    # Join -> Parallel Adversarial (Round 2)
    for agent in ADVERSARIAL_AGENTS:
        workflow.add_edge("round2_join", f"adversarial_{agent}_r2")
        workflow.add_edge(f"adversarial_{agent}_r2", "round2_adv_join")

    # --- ROUND 3 ---
    # Adv Join 2 -> Parallel Decision ONLY (Round 3)
    for agent in DECISION_AGENTS:
        workflow.add_edge("round2_adv_join", f"decision_{agent}_r3")
        workflow.add_edge(f"decision_{agent}_r3", "round3_join")
        
    # Join -> Parallel Adversarial (Round 3)
    for agent in ADVERSARIAL_AGENTS:
        workflow.add_edge("round3_join", f"adversarial_{agent}_r3")
        workflow.add_edge(f"adversarial_{agent}_r3", "round3_adv_join")

    # --- MODERATOR ---
    # Adv Join 3 -> Moderator -> End
    workflow.add_edge("round3_adv_join", "moderator_node")
    workflow.add_edge("moderator_node", END)

    # ---------------------------------------------------------
    # 3. COMPILE
    # ---------------------------------------------------------
    
    return workflow.compile()

# Provide a ready-to-use graph instance
debate_graph = build_debate_graph()
