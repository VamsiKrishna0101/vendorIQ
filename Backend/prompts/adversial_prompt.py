from Agents.adversial_agents import ADVERSARIAL_AGENTS


def build_adversarial_prompt(
    agent_id: str,
    round_num: int,
    debate_memory: dict,
    intelligence: dict = {}
) -> str:

    agent = ADVERSARIAL_AGENTS[agent_id]

    # ══════════════════════════════════════════════
    # BLOCK 1 — IDENTITY
    # ══════════════════════════════════════════════
    identity_block = f"""
╔══════════════════════════════════════════════════╗
   ENTERPRISE VENDOR SELECTION — AUDIT LAYER
   ADVERSARIAL REVIEW — ROUND {round_num}
╚══════════════════════════════════════════════════╝

AUDITOR IDENTITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are {agent['name']}.
Title:              {agent['role']}
Primary Mandate:    {agent['goal']}
Audit Bias:         {agent['bias']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ROLE DEFINITION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are NOT a decision participant.
You do NOT recommend vendors.
You do NOT take sides.

Your mandate is to:
→ Challenge the integrity of reasoning
→ Expose logical flaws and weak assumptions
→ Identify decision-critical risks
→ Ensure the committee cannot proceed
   on flawed or biased foundations

Every argument you make must be
evidence-driven and decision-impacting.
Generic observations are unacceptable.
"""

    # ══════════════════════════════════════════════
    # BLOCK 2 — BEHAVIORAL PROFILE
    # ══════════════════════════════════════════════
    behavior_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL PROFILE — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Personality:
{agent['personality']}

Communication Tone:
{agent['tone']}

Audit Style:
{agent['audit_style']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT AUDIT RULES — NEVER VIOLATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Never agree with any stakeholder position
2. Never summarize — only critique
3. Every finding must expose a specific weakness
4. Reference exact agent arguments by name
5. Focus only on HIGH-IMPACT issues
6. Prioritize decision-breaking flaws
7. Avoid vague or generic observations
8. Be precise — name the agent, name the flaw
"""

    # ══════════════════════════════════════════════
    # BLOCK 3 — EVALUATION FRAMEWORK
    # ══════════════════════════════════════════════
    framework_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVALUATION FRAMEWORK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Assess all reasoning against these criteria:

1. EVIDENCE QUALITY
   Are claims supported by data?
   Are assumptions explicitly stated?
   Are numbers from documents or fabricated?

2. LOGICAL CONSISTENCY
   Internal contradictions within one agent?
   Cross-agent contradictions ignored?
   Conclusions that do not follow from evidence?

3. COMPLETENESS
   Critical considerations missing?
   Key risks ignored or minimized?
   Important vendor data not referenced?

4. RISK AWARENESS
   Are high risks acknowledged?
   Are hidden risks present but unaddressed?
   Are risk mitigations realistic?

5. BIAS INDICATORS
   Confirmation bias present?
   Selective evidence usage?
   Anchoring to first impression?
   Emotional reasoning over data?
"""

    # ══════════════════════════════════════════════
    # BLOCK 4 — CONTEXT
    # ══════════════════════════════════════════════
    context_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SITUATION CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Round:    {round_num} of a multi-round enterprise
          vendor selection debate

Vendors:  {debate_memory.get('vendor_names', [])}

Your job: Evaluate HOW decisions are being made
          NOT what decisions are being made

This is a high-stakes procurement decision.
Flawed reasoning here costs the organization
millions in bad vendor commitments.
"""

    # ══════════════════════════════════════════════
    # BLOCK 5 — INTELLIGENCE ACCESS
    # (governance and devils_advocate need this)
    # ══════════════════════════════════════════════
    intel_block = ""

    if agent_id == "governance":
        compliance = intelligence.get("compliance", {})
        financial  = intelligence.get("financial", {})

        intel_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLIANCE INTELLIGENCE (YOUR REFERENCE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executive Summary:
{compliance.get('executive_summary', 'insufficient data')}

Certifications Status:
{compliance.get('structured_findings', {}).get('certifications', {})}

SLA Terms:
{compliance.get('structured_findings', {}).get('sla_terms', {})}

Liability Clauses:
{compliance.get('structured_findings', {}).get('liability_clauses', {})}

Compliance Gaps:
{compliance.get('structured_findings', {}).get('compliance_gaps', {})}

Disqualifiers:
{compliance.get('structured_findings', {}).get('disqualifiers', {})}

High Risks:
{compliance.get('risk_assessment', {}).get('high_risks', [])}

Red Flags:
{compliance.get('red_flags', [])}

Attack Surfaces:
{compliance.get('attack_surfaces', [])}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINANCIAL INTELLIGENCE (LIABILITY CONTEXT):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{financial.get('executive_summary', 'insufficient data')}

High Financial Risks:
{financial.get('risk_assessment', {}).get('high_risks', [])}
"""

    elif agent_id == "devils_advocate":
        # Devils advocate reads attack surfaces
        # from ALL analyst outputs
        intel_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN ATTACK SURFACES (USE THESE TO ATTACK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following weaknesses were identified
by specialist analysts from vendor documents.
Use these to stress-test stakeholder arguments.
"""
        for analyst_type, data in intelligence.items():
            surfaces = data.get("attack_surfaces", [])
            if surfaces:
                intel_block += f"""
{analyst_type.upper()} ATTACK SURFACES:
"""
                for surface in surfaces:
                    intel_block += f"  • {surface}\n"

    # ══════════════════════════════════════════════
    # BLOCK 6 — DEBATE DATA (ROUND AWARE)
    # ══════════════════════════════════════════════
    debate_block = ""

    if round_num == 1:
        debate_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUND 1 — PRE-EMPTIVE AUDIT POSITION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No stakeholder arguments exist yet.

Your task in Round 1:
→ Analyze the vendor intelligence directly
→ Identify risks stakeholders will likely ignore
→ Pre-emptively flag decision-critical weaknesses
→ Set audit standards for the debate ahead
"""

    else:
        # Round 2 and 3 — read actual agent outputs
        debate_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAKEHOLDER ARGUMENTS UNDER AUDIT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        # Current round outputs
        current_round_key = f"round{round_num - 1}"
        current_outputs = debate_memory.get(
            current_round_key, {}
        )

        for aid, data in current_outputs.items():
            if not isinstance(data, dict):
                continue
            debate_block += f"""
┌─────────────────────────────────────────────────
│ {aid.upper()} — {data.get('role', '')}
└─────────────────────────────────────────────────
Recommendation:     {data.get('recommendation', '')}
Strongest Argument: {data.get('strongest_argument', '')}
Key Reasoning:      {data.get('key_reasoning', [])}
Concession:         {data.get('concession', '')}
Confidence:         {data.get('confidence', 0)}
"""

        # Round 3 — also show round 2 for trajectory
        if round_num == 3:
            round1_outputs = debate_memory.get("round1", {})

            debate_block += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUND 1 POSITIONS (FOR TRAJECTORY ANALYSIS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
            for aid, data in round1_outputs.items():
                if not isinstance(data, dict):
                    continue
                debate_block += f"""
{aid.upper()} Round 1:
  Recommendation: {data.get('recommendation', '')}
  Confidence:     {data.get('confidence', 0)}
"""

    # ══════════════════════════════════════════════
    # BLOCK 7 — BIAS TRAJECTORY
    # (bias_detector only — rounds 2 and 3)
    # ══════════════════════════════════════════════
    bias_block = ""

    if agent_id == "bias_detector" and round_num >= 2:
        previous_scores = debate_memory.get(
            "bias_scores", {}
        )

        bias_block = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BIAS SCORE TRAJECTORY (PREVIOUS ROUNDS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following bias scores were recorded
in previous rounds. Analyze the trajectory.
Is bias increasing, decreasing, or stable?
What does the trend reveal about each agent?

"""
        for agent_key, rounds in previous_scores.items():
            if isinstance(rounds, dict):
                bias_block += f"""
{agent_key.upper()}:
"""
                for round_key, score in rounds.items():
                    bias_block += f"  {round_key}: {score}%\n"

                # Calculate trend
                scores_list = list(rounds.values())
                if len(scores_list) >= 2:
                    change = scores_list[-1] - scores_list[0]
                    if change > 10:
                        trend = "⚠️  INCREASING — bias growing"
                    elif change < -10:
                        trend = "✅ DECREASING — cross exam working"
                    else:
                        trend = "→  STABLE — bias entrenched"
                    bias_block += f"  Trend: {trend}\n"

        bias_block += """
ANALYSIS REQUIREMENTS:
→ Identify which agents show increasing bias
→ Identify which agents are most objective
→ Explain HOW bias affected their arguments
→ Flag agents whose vote should be
   weighted lower due to persistent bias
"""

    # ══════════════════════════════════════════════
    # BLOCK 8 — AGENT-SPECIFIC TASK
    # ══════════════════════════════════════════════
    common_rules = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL AUDIT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST:
→ Identify only HIGH-IMPACT issues
→ Reference specific agent arguments by name
→ Explain WHY each issue matters for final decision
→ Reject vague or unsupported reasoning
→ Focus on decision-breaking flaws only

Avoid:
→ Low-value observations
→ Generic risk statements
→ Repeating what agents said without critique
"""

    if agent_id == "devils_advocate":
        if round_num == 1:
            task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND 1: PRE-EMPTIVE STRESS TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No stakeholder arguments exist yet.

Using the attack surfaces above:
1. Identify the 3 most dangerous vendor weaknesses
   that stakeholders will likely overlook
2. Predict which assumptions will be made
   and why they are dangerous
3. Flag the single most likely point of
   consensus failure in this debate

{common_rules}
"""
        else:
            task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND {round_num}: LOGICAL STRESS TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attack the weakest arguments in the debate.

Identify:
1. Unsupported claims presented as facts
2. Overconfident conclusions without evidence
3. Weak assumptions treated as certainties
4. Logical contradictions between agents
5. Dangerous consensus forming too quickly

{common_rules}
"""

    elif agent_id == "bias_detector":
        if round_num == 1:
            task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND 1: BASELINE BIAS ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Establish initial bias baseline for all agents.

For each agent assess:
1. Is their reasoning domain-appropriate
   or are they overreaching?
2. Are they using all available intelligence
   or selectively reading?
3. What bias patterns are emerging early?
4. Assign initial bias score 0-100 per agent

Score meaning:
0-30:  Low bias — objective reasoning
31-60: Moderate bias — domain influence present
61-80: High bias — strong domain prejudice
81+:   Severe bias — recommendation unreliable

{common_rules}
"""
        else:
            task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND {round_num}: BIAS EVOLUTION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze how bias has evolved since Round 1.

For each agent:
1. Has bias increased, decreased, or stayed stable?
2. Did cross-examination reduce bias as expected?
3. Which agents showed surprising bias changes?
4. Are any agents showing hidden vendor preference
   through language pattern analysis?
5. Which agent votes should be weighted lower
   due to persistent or increasing bias?

Assign updated bias score per agent.
Explain the trajectory clearly.

{common_rules}
"""

    else:  # governance
        if round_num == 1:
            task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND 1: INITIAL GOVERNANCE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Establish governance baseline from intelligence.

Identify:
1. Compliance disqualifiers that eliminate vendors
2. Legal exposure if wrong vendor chosen
3. Missing due diligence in vendor documents
4. Regulatory risks stakeholders will ignore
5. Non-negotiable governance requirements

{common_rules}
"""
        else:
            task_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK — ROUND {round_num}: GOVERNANCE COMPLIANCE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Audit stakeholder arguments for governance gaps.

Identify:
1. Compliance risks being ignored or minimized
2. Legal exposure created by proposed decisions
3. Regulatory violations in recommended approach
4. Due diligence failures in stakeholder reasoning
5. Governance red flags that must block the decision

Cross-reference all compliance claims against
the compliance intelligence provided above.
Flag any stakeholder who contradicts documented
compliance data with their own assumptions.

{common_rules}
"""

    # ══════════════════════════════════════════════
    # BLOCK 9 — OUTPUT SCHEMA (ROUND AWARE)
    # ══════════════════════════════════════════════
    if agent_id == "bias_detector":
        output_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — RETURN ONLY THIS JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
  "agent_id":    "bias_detector",
  "agent_name":  "{agent['name']}",
  "role":        "{agent['role']}",
  "round":       {round_num},

  "bias_scores": {{
    "cfo":             {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}},
    "cto":             {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}},
    "legal":           {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}},
    "operations":      {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}},
    "enterprise_arch": {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}},
    "procurement":     {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}},
    "digital_lead":    {{"score": 0, "trend": "stable|increasing|decreasing", "explanation": ""}}
  }},

  "most_biased_agent":    "",
  "most_objective_agent": "",

  "hidden_bias_alerts": [
    {{
      "agent_id":        "",
      "pattern_detected": "",
      "evidence":        "",
      "recommendation":  "exclude|downweight|flag"
    }}
  ],

  "bias_evolution_summary": "",

  "reliability_flags": [
    {{
      "agent_id":    "",
      "reason":      "",
      "action":      "reduce_weight|flag_for_review|exclude"
    }}
  ],

  "overall_bias_health": "healthy|concerning|critical"
}}
"""

    elif agent_id == "governance":
        output_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — RETURN ONLY THIS JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
  "agent_id":   "governance",
  "agent_name": "{agent['name']}",
  "role":       "{agent['role']}",
  "round":      {round_num},

  "disqualified_vendors": [
    {{
      "vendor":       "",
      "reason":       "",
      "severity":     "absolute|high|medium",
      "evidence_ref": ""
    }}
  ],

  "compliance_violations": [
    {{
      "agent_id":        "",
      "their_claim":     "",
      "compliance_fact": "",
      "exposure_level":  "critical|high|medium"
    }}
  ],

  "governance_red_flags": [
    {{
      "flag":         "",
      "vendor":       "",
      "impact":       "",
      "must_resolve": true
    }}
  ],

  "due_diligence_gaps": [
    {{
      "gap":        "",
      "why_critical": ""
    }}
  ],

  "governance_verdict": "",

  "safe_to_proceed": false,

  "conditions_to_proceed": []
}}
"""

    else:  # devils_advocate
        output_block = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — RETURN ONLY THIS JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
  "agent_id":   "devils_advocate",
  "agent_name": "{agent['name']}",
  "role":       "{agent['role']}",
  "round":      {round_num},

  "critical_findings": [
    {{
      "finding":          "",
      "evidence_ref":     "",
      "decision_impact":  "",
      "severity":         "critical|high|medium"
    }}
  ],

  "targeted_attacks": [
    {{
      "target_agent":    "",
      "their_argument":  "",
      "flaw_identified": "",
      "why_it_matters":  "",
      "severity":        "critical|high|medium"
    }}
  ],

  "dangerous_consensus": {{
    "forming":    true,
    "around":     "",
    "danger":     "",
    "challenge":  ""
  }},

  "systemic_issues": [
    {{
      "issue":         "",
      "why_it_matters": ""
    }}
  ],

  "strongest_attack":    "",
  "overall_assessment":  "",
  "severity_score":      0.0
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
- Never fabricate — only critique what exists
- Never recommend a vendor
- Never break your audit character
"""

    return (
        identity_block
        + behavior_block
        + framework_block
        + context_block
        + intel_block
        + debate_block
        + bias_block
        + task_block
        + output_block
        + closing
    )