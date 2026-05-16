import sys
import os
import json

# Add Backend to sys.path so we can import from prompts
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prompts.decision_prompt import build_decision_prompt
from prompts.moderator_prompt import build_moderator_prompt
from prompts.adversial_prompt import build_adversarial_prompt
from prompts.customer_prompt import build_customer_prompt
from prompts.analyst_prompts import (
    FINANCIAL_ANALYST_PROMPT,
    TECHNICAL_ANALYST_PROMPT,
    COMPLIANCE_ANALYST_PROMPT,
    MARKET_ANALYST_PROMPT,
    CUSTOMER_SENTIMENT_PROMPT
)

# Mock Data
mock_intelligence = {
    "financial": {
        "executive_summary": "Financial summary",
        "key_insights": ["Insight 1", "Insight 2"],
        "vendor_scores": {"VendorA": {"score": 80, "reasoning": "Reasoning"}},
        "risk_assessment": {"high_risks": [], "medium_risks": [], "low_risks": []},
        "red_flags": [],
        "attack_surfaces": ["Surface 1"],
        "tradeoffs": [],
        "cross_agent_signals": {"questions_for_other_agents": [], "dependencies_on_other_domains": []},
        "missing_information": [],
        "confidence_per_vendor": {"VendorA": 0.8},
        "structured_findings": {
            "certifications": {},
            "sla_terms": {},
            "liability_clauses": {},
            "compliance_gaps": {},
            "disqualifiers": {}
        }
    },
    "technical": {
        "executive_summary": "Technical summary",
        "key_insights": [],
        "vendor_scores": {},
        "risk_assessment": {"high_risks": [], "medium_risks": [], "low_risks": []},
        "red_flags": [],
        "attack_surfaces": [],
        "tradeoffs": [],
        "cross_agent_signals": {},
        "missing_information": [],
        "confidence_per_vendor": {}
    },
    "compliance": {
        "executive_summary": "Compliance summary",
        "structured_findings": {
            "certifications": {"VendorA": "Certified"},
            "sla_terms": {"VendorA": "Good"},
            "liability_clauses": {"VendorA": "Standard"},
            "compliance_gaps": {"VendorA": "None"},
            "disqualifiers": {"VendorA": "None"}
        },
        "risk_assessment": {"high_risks": []},
        "red_flags": [],
        "attack_surfaces": []
    },
    "customer_sentiment": {
        "executive_summary": "Customer summary",
        "structured_findings": {
            "usability": {"VendorA": "Good"},
            "support_experience": {"VendorA": {"response_time": "1h", "support_tiers": "Gold", "quality_signals": "High"}},
            "onboarding_experience": {"VendorA": "Fast"},
            "common_complaints": {"VendorA": ["None"]},
            "adoption_risk": {"VendorA": "Low"}
        },
        "attack_surfaces": [],
        "red_flags": [],
        "confidence_per_vendor": {"VendorA": 0.9}
    }
}

mock_debate_memory = {
    "vendor_names": ["VendorA", "VendorB"],
    "buyer_context": {"industry": "Finance", "size": "Enterprise"},
    "round1": {
        "cfo": {
            "role": "Chief Financial Officer",
            "recommendation": "VendorA",
            "strongest_argument": "Lower TCO",
            "key_reasoning": ["Reason 1"],
            "confidence": 0.9,
            "parsed_output": {
                "recommendation": "VendorA",
                "score_per_vendor": {"VendorA": 90, "VendorB": 70}
            }
        },
        "positive_rep": {
            "experience_summary": "Good",
            "what_worked": ["Everything"],
            "trust_level": 5
        },
        "negative_rep": {},
        "neutral_rep": {}
    },
    "rounds": {
        "round1": {
            "cfo": {
                "parsed_output": {
                    "recommendation": "VendorA",
                    "score_per_vendor": {"VendorA": 90, "VendorB": 70}
                }
            }
        },
        "round2": {},
        "round3": {}
    },
    "customer": {
        "positive_rep": {"parsed_output": {"experience_summary": "Good", "trust_per_vendor": {"VendorA": 5}}},
        "negative_rep": {"parsed_output": {"experience_summary": "Bad", "trust_per_vendor": {"VendorB": 1}}},
        "neutral_rep": {"parsed_output": {"experience_summary": "OK", "trust_per_vendor": {"VendorA": 3}}}
    },
    "adversarial": {
        "governance": {"parsed_output": {"governance_verdict": "PASSED", "safe_to_proceed": True}}
    },
    "bias_scores": {
        "cfo": {"1": 20, "2": 25}
    }
}

def test_all_prompts():
    print("Testing Decision Prompt (Round 1)...")
    p1 = build_decision_prompt("cfo", 1, mock_intelligence, mock_debate_memory)
    print("Success. Prompt length:", len(p1))

    print("Testing Decision Prompt (Round 3)...")
    p2 = build_decision_prompt("cfo", 3, mock_intelligence, mock_debate_memory)
    print("Success. Prompt length:", len(p2))

    print("Testing Moderator Prompt...")
    p3 = build_moderator_prompt(mock_debate_memory)
    print("Success. Prompt length:", len(p3))

    print("Testing Adversarial Prompt (Governance, Round 2)...")
    p4 = build_adversarial_prompt("governance", 2, mock_debate_memory, mock_intelligence)
    print("Success. Prompt length:", len(p4))

    print("Testing Customer Prompt (Round 1)...")
    p5 = build_customer_prompt("positive_rep", 1, mock_intelligence, mock_debate_memory)
    print("Success. Prompt length:", len(p5))

    print("Testing Analyst Prompts (formatting check)...")
    vendor_list_str = ", ".join(mock_debate_memory["vendor_names"])
    p6 = FINANCIAL_ANALYST_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)")
    print("Success. Financial Analyst Prompt length:", len(p6))
    
    p7 = TECHNICAL_ANALYST_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)")
    print("Success. Technical Analyst Prompt length:", len(p7))

if __name__ == "__main__":
    try:
        test_all_prompts()
        print("\nALL PROMPTS GENERATED SUCCESSFULLY WITHOUT ERRORS.")
    except Exception as e:
        print(f"\nPROMPT GENERATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
