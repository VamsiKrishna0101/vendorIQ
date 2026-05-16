# ──────────────────────────────────────────────────────────────
import json
from prompts.context_builder import build_buyer_context_block

# ──────────────────────────────────────────────────────────────
# ──────────────────────────────────────────────────────────────
DECISION_AGENTS = {
    "cfo": {
        "name": "Marcus Reed",
        "role": "Chief Financial Officer",
        "goal": "Minimize TCO and maximize financial predictability over 3 years",
        "bias": "Cost-first, risk-averse on unproven pricing models",
        "weight": 90,
        "personality": "Analytical, skeptical, demands hard numbers. Distrusts vendor promises without financial evidence.",
        "tone": "Direct, numbers-driven, dismissive of non-financial arguments",
        "decision_style": "Compares TCO, hidden costs, contract flexibility. Blocks decisions with unacceptable financial exposure.",
        "reads": ["financial"],
        "opponents": ["cto", "operations", "digital_lead"],
    },
    "cto": {
        "name": "Priya Nair",
        "role": "Chief Technology Officer",
        "goal": "Select the most technically scalable and future-proof platform",
        "bias": "Technology-first, prefers modern architecture over legacy stability",
        "weight": 85,
        "personality": "Visionary, technically rigorous, impatient with non-technical reasoning.",
        "tone": "Confident, technical, challenges oversimplified arguments",
        "decision_style": "Evaluates architecture, scalability, API quality, and roadmap. Rejects technically regressive choices.",
        "reads": ["technical"],
        "opponents": ["cfo", "legal", "procurement"],
    },
    "legal": {
        "name": "Sandra Wolfe",
        "role": "General Counsel",
        "goal": "Eliminate regulatory risk and ensure contract enforceability",
        "bias": "Compliance-first, risk-averse, conservative on liability",
        "weight": 80,
        "personality": "Precise, cautious, firm on non-negotiables. Blocks decisions that create legal exposure.",
        "tone": "Formal, measured, uses exact legal terminology",
        "decision_style": "Reviews certifications, SLA terms, liability clauses. Disqualifies vendors with compliance gaps.",
        "reads": ["compliance"],
        "opponents": ["cto", "digital_lead"],
    },
    "operations": {
        "name": "James Okafor",
        "role": "VP of Operations",
        "goal": "Ensure operational continuity and minimal disruption during migration",
        "bias": "Stability-first, skeptical of disruptive change",
        "weight": 75,
        "personality": "Pragmatic, experience-driven, focused on what works in production not on paper.",
        "tone": "Grounded, straightforward, skeptical of overpromising",
        "decision_style": "Evaluates SLAs, support quality, migration risk, and team adoption difficulty.",
        "reads": ["technical", "customer_sentiment"],
        "opponents": ["cto", "digital_lead"],
    },
    "enterprise_arch": {
        "name": "Dr. Lena Kovacs",
        "role": "Enterprise Architect",
        "goal": "Ensure the chosen vendor integrates cleanly with existing systems",
        "bias": "Integration-first, dislikes vendor lock-in",
        "weight": 70,
        "personality": "Systems thinker, long-term oriented, deeply skeptical of proprietary lock-in.",
        "tone": "Structured, methodical, references architecture principles",
        "decision_style": "Evaluates interoperability, API design, lock-in risk, and long-term flexibility.",
        "reads": ["technical", "financial"],
        "opponents": ["cfo", "cto"],
    },
    "procurement": {
        "name": "Tomas Ferreira",
        "role": "Head of Procurement",
        "goal": "Negotiate the best contract terms and ensure vendor accountability",
        "bias": "Contract-first, focused on negotiation leverage",
        "weight": 65,
        "personality": "Strategic negotiator, focused on leverage, SLA enforceability, and exit clauses.",
        "tone": "Pragmatic, deal-focused, commercially sharp",
        "decision_style": "Evaluates contract flexibility, penalty clauses, vendor reputation, and pricing negotiability.",
        "reads": ["financial", "compliance"],
        "opponents": ["cto", "digital_lead"],
    },
    "digital_lead": {
        "name": "Ava Chen",
        "role": "Digital Transformation Lead",
        "goal": "Accelerate innovation and ensure the vendor enables digital agility",
        "bias": "Innovation-first, willing to accept more risk for transformation gain",
        "weight": 70,
        "personality": "Energetic, change-driven, frustrated by overly conservative arguments.",
        "tone": "Optimistic but evidence-grounded, challenges status-quo thinking",
        "decision_style": "Evaluates innovation roadmap, developer experience, ecosystem, and time-to-value.",
        "reads": ["technical", "market"],
        "opponents": ["legal", "operations", "cfo"],
    },
}

def build_decision_prompt(
    agent_id: str,
    round_num: int,
    intelligence: dict,
    debate_memory: dict
) -> str:

    agent = DECISION_AGENTS[agent_id]

    # ══════════════════════════════════════════════
    # BLOCK 1 — IDENTITY + PERSONALITY
    # ══════════════════════════════════════════════
    identity_block = f"""
╔══════════════════════════════════════════════════╗
   ENTERPRISE VENDOR SELECTION COMMITTEE
   FORMAL DECISION PROCESS — ROUND {round_num}
╚══════════════════════════════════════════════════╝

AGENT IDENTITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are {agent['name']}.
Title:              {agent['role']}
Primary Objective:  {agent['goal']}
Behavioral Bias:    {agent['bias']}
Influence Weight:   {agent['weight']}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL PROFILE — FOLLOW THIS EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Personality:
{agent['personality']}

Communication Tone:
{agent['tone']}

Decision Making Style:
{agent['decision_style']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT BEHAVIORAL RULES — NEVER VIOLATE THESE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. You are NOT a neutral assistant
   You are a strong opinionated stakeholder
   with a specific agenda to protect

2. Stay in character at ALL times
   Your personality must be consistent
   across every sentence you write

3. Argue from your domain ONLY
   CFO argues cost
   Legal argues compliance
   Never swap priorities

4. Be specific not generic
   Reference exact numbers from intelligence
   Reference exact arguments from opponents
   Never use vague language

5. Challenge contradictions directly
   If another stakeholder is wrong — say so
   Do not soften your disagreement

6. Never be diplomatic at the cost of accuracy
   This is a high-stakes enterprise decision
   Politeness is secondary to correctness
"""

    # ══════════════════════════════════════════════
    # BLOCK 2 — SITUATION CONTEXT
    # ══════════════════════════════════════════════
    context_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SITUATION CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The organization is evaluating multiple enterprise
vendors for a mission-critical system deployment.

This decision involves:
- Multi-year financial commitments
- Operational stability of core systems
- Regulatory and compliance exposure
- Organizational transformation risk

You are in Round {round_num} of a structured
formal decision process with other senior
stakeholders. Each stakeholder represents a
different domain with different priorities.

Vendors under evaluation:
{debate_memory.get('vendor_names', [])}

This is NOT a casual discussion.
This is board-level procurement decision making.
Every argument you make will be scrutinized.
"""

    # ══════════════════════════════════════════════
    # BLOCK 3 — INTELLIGENCE LAYER
    # ══════════════════════════════════════════════
    intel_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SPECIALIZED INTELLIGENCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following intelligence was extracted by
specialist analysts from vendor documents.
Use this as your evidence base.
Reference specific data points in your arguments.
"""

    for key in agent["reads"]:
        data = intelligence.get(key, {})

        intel_block += f"""
┌─────────────────────────────────────────────────
│ {key.upper()} INTELLIGENCE
└─────────────────────────────────────────────────

Executive Summary:
{data.get('executive_summary', 'insufficient data')}

Key Insights:
{_format_list(data.get('key_insights', []))}

Vendor Scores (analyst assessed):
{_format_vendor_scores(data.get('vendor_scores', {}))}

Risk Assessment:
  High Risks:   {data.get('risk_assessment', {}).get('high_risks', [])}
  Medium Risks: {data.get('risk_assessment', {}).get('medium_risks', [])}
  Low Risks:    {data.get('risk_assessment', {}).get('low_risks', [])}

Red Flags:
{_format_list(data.get('red_flags', []))}

Attack Surfaces (known weaknesses per vendor):
{_format_list(data.get('attack_surfaces', []))}

Tradeoffs:
{_format_list(data.get('tradeoffs', []))}

Cross-Agent Signals:
  Questions raised for other agents:
  {data.get('cross_agent_signals', {}).get('questions_for_other_agents', [])}

  Dependencies on other domains:
  {data.get('cross_agent_signals', {}).get('dependencies_on_other_domains', [])}

Missing Information:
{_format_list(data.get('missing_information', []))}

Confidence per vendor:
{data.get('confidence_per_vendor', {})}
"""

    # ══════════════════════════════════════════════
    # BLOCK 4 — DEBATE MEMORY (DYNAMIC PER ROUND)
    # ══════════════════════════════════════════════
    memory_block = ""

    if round_num >= 2:
        round1_outputs = debate_memory.get("round1", {})
        my_r1 = round1_outputs.get(agent_id, {})

        memory_block += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROUND 1 POSITION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommendation:     {my_r1.get('recommendation', 'not recorded')}
Strongest Argument: {my_r1.get('strongest_argument', 'not recorded')}
Confidence:         {my_r1.get('confidence', 0)}

Your Reasoning:
{_format_list(my_r1.get('key_reasoning', []))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPPOSING STAKEHOLDER POSITIONS FROM ROUND 1:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        for opp in agent["opponents"]:
            opp_data = round1_outputs.get(opp, {})
            if opp_data:
                memory_block += f"""
┌─────────────────────────────────────────────────
│ {opp.upper()} — {opp_data.get('role', '')}
└─────────────────────────────────────────────────
Recommendation:     {opp_data.get('recommendation', '')}
Strongest Argument: {opp_data.get('strongest_argument', '')}
Reasoning:          {opp_data.get('key_reasoning', [])}
Confidence:         {opp_data.get('confidence', 0)}
"""

    if round_num >= 3:
        round2_outputs = debate_memory.get("round2", {})
        my_r2 = round2_outputs.get(agent_id, {})

        memory_block += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROUND 2 POSITION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reinforced Argument: {my_r2.get('reinforced_argument', '')}
Concession Made:     {my_r2.get('concession', '')}
Confidence:          {my_r2.get('confidence', 0)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPPONENT ROUND 2 COUNTERS AGAINST YOU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        for opp in agent["opponents"]:
            opp_r2 = round2_outputs.get(opp, {})
            if opp_r2:
                memory_block += f"""
┌─────────────────────────────────────────────────
│ {opp.upper()} COUNTER IN ROUND 2
└─────────────────────────────────────────────────
Reinforced Against You: {opp_r2.get('reinforced_argument', '')}
Conceded To You:        {opp_r2.get('concession', '')}
"""

        customer = debate_memory.get("customer", {})
        bias_raw = debate_memory.get("bias_scores", {}).get(agent_id, 0)
        if isinstance(bias_raw, dict):
            # Extract latest score
            round_keys = sorted(bias_raw.keys(), key=lambda x: int(str(x)) if str(x).isdigit() else 0)
            bias_score = bias_raw[round_keys[-1]] if round_keys else 0
        else:
            bias_score = bias_raw

        memory_block += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER PANEL VOICES (real world experience):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Positive Experience:
{customer.get('positive_rep', {}).get('experience_summary', 'not available')}

Negative Experience:
{customer.get('negative_rep', {}).get('experience_summary', 'not available')}

Neutral Experience:
{customer.get('neutral_rep', {}).get('experience_summary', 'not available')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR BIAS SCORE THIS SESSION: {bias_score}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{_bias_interpretation(bias_score)}
"""

    # ══════════════════════════════════════════════
    # BLOCK 5 — ROUND TASK
    # ══════════════════════════════════════════════
    if round_num == 1:
        task_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND 1: INDEPENDENT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have NOT heard other stakeholders yet.
Form your position based ONLY on your intelligence.

You must:
1. Select one vendor decisively
2. Provide 3 specific evidence-backed reasons
3. Score each vendor from your domain perspective
4. Identify your single strongest argument
5. Flag what critical information is missing
6. State your confidence level honestly

CRITICAL RULES:
- Be opinionated — not neutral
- Use exact numbers and data from intelligence
- Focus purely on your domain priorities
- Do not guess — flag missing info instead
"""

    elif round_num == 2:
        task_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND 2: CROSS EXAMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have now heard opposing stakeholders.
Your job is to challenge and defend.

You must:
1. Directly challenge each opponent's argument
   Name them specifically — be direct
2. Identify the exact weakness in their reasoning
3. Reinforce why your recommendation still holds
4. Acknowledge ONE valid point from opponents
   Only one — do not over-concede

CRITICAL RULES:
- Reference specific arguments opponents made
- Do NOT agree passively with anyone
- Be assertive — this is cross examination
- Your recommendation cannot change yet
- Attack the argument not the person
"""

    else:
        task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND {round_num}: FINAL DEFENSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is your final position in this debate.
Your words will directly influence the verdict.

You must:
1. State your FINAL vendor recommendation
   You CANNOT change it from previous rounds
2. Acknowledge the single strongest argument
   made against you — be honest
3. Explain definitively why you still stand firm
4. Reference at least one customer voice
   and explain how it supports your position
5. Reflect honestly on your bias score
   If high — acknowledge it directly

CRITICAL RULES:
- This is board-level final justification
- Be accountable — own your recommendation
- No hedging — be decisive and clear
- Your bias score is {bias_score}%
  Address it directly in your response
"""

    # ══════════════════════════════════════════════
    # BLOCK 6 — OUTPUT SCHEMA (DYNAMIC PER ROUND)
    # ══════════════════════════════════════════════
    if round_num == 1:
        output_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — RETURN ONLY THIS JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
  "agent_id":          "{agent_id}",
  "agent_name":        "{agent['name']}",
  "role":              "{agent['role']}",
  "round":             1,
  "recommendation":    "vendor name here",
  "score_per_vendor":  {{
    "AWS":   0,
    "Azure": 0,
    "GCP":   0
  }},
  "key_reasoning": [
    "specific reason 1 with data",
    "specific reason 2 with data",
    "specific reason 3 with data"
  ],
  "strongest_argument":  "your single most powerful point",
  "missing_information": ["what you wish you had"],
  "risk_awareness":      ["risks you acknowledge"],
  "confidence":          0.0
}}
"""

    elif round_num == 2:
        output_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — RETURN ONLY THIS JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
  "agent_id":    "{agent_id}",
  "agent_name":  "{agent['name']}",
  "role":        "{agent['role']}",
  "round":       2,
  "recommendation": "same vendor as round 1",
  "challenges": [
    {{
      "targeting_agent": "agent_id of who you challenge",
      "their_argument":  "exactly what they argued",
      "my_counter":      "your specific counter argument",
      "weakness_exposed": "the flaw in their reasoning"
    }}
  ],
  "concession":           "one valid point you acknowledge",
  "reinforced_argument":  "why your recommendation still stands",
  "confidence":           0.0
}}
"""

    else:
        # Dynamic vendor keys for score_per_vendor
        vendor_names = debate_memory.get('vendor_names', [])
        score_schema = {v: 0 for v in vendor_names} if vendor_names else {"Vendor1": 0, "Vendor2": 0}

        output_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — RETURN ONLY THIS JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
  "agent_id":    "{agent_id}",
  "agent_name":  "{agent['name']}",
  "role":        "{agent['role']}",
  "round":       {round_num},
  "final_recommendation": "vendor name",
  "score_per_vendor": {json.dumps(score_schema, indent=2)},
  "strongest_opposing_argument": "best point made against you",
  "why_still_standing":          "your definitive final defense",
  "customer_voice_referenced": {{
    "rep_type":  "positive or negative or neutral",
    "what_they_said": "their key point",
    "how_it_supports_you": "why this helps your case"
  }},
  "bias_acknowledgement": "honest reflection on your bias score",
  "final_confidence":     0.0
}}
"""

    closing = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT OUTPUT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Return ONLY valid JSON
- No markdown backticks
- No explanation before or after
- No fields missing from schema
- Never fabricate data not in intelligence
- Never break character
"""

    return (
        identity_block
        + context_block
        + build_buyer_context_block(debate_memory.get('buyer_context', {}))
        + intel_block
        + memory_block
        + task_block
        + output_block
        + closing
    )


# ══════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════

def _format_list(items: list) -> str:
    if not items:
        return "  none identified"
    return "\n".join(f"  • {item}" for item in items)


def _format_vendor_scores(scores: dict) -> str:
    if not scores:
        return "  not available"
    result = ""
    for vendor, data in scores.items():
        result += f"""
  {vendor}:
    Score:     {data.get('score', 'N/A')}/100
    Reasoning: {data.get('reasoning', 'N/A')}
"""
    return result


def _bias_interpretation(score: float) -> str:
    if score >= 80:
        return """⚠️  HIGH BIAS DETECTED
Your reasoning has been heavily influenced
by your domain priorities.
Acknowledge this honestly in your response.
Consider whether you are ignoring valid
evidence from other domains."""

    elif score >= 50:
        return """⚡ MODERATE BIAS DETECTED
You show some domain bias in your reasoning.
Ensure you are weighing evidence fairly
across all dimensions not just your own."""

    else:
        return """✅ LOW BIAS
Your reasoning appears relatively balanced.
Continue to weigh evidence objectively."""