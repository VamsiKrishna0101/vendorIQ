def build_buyer_context_block(buyer_context: dict) -> str:
    if not buyer_context:
        return ""
    
    return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUYING ORGANIZATION CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Company:      {buyer_context.get('companyName', 'Not specified')}
Industry:     {buyer_context.get('industry', 'Not specified')}
Size:         {buyer_context.get('size', 'Not specified')} employees
Tech Stack:   {buyer_context.get('techStack', 'Not specified')}
Requirements: {buyer_context.get('keyRequirements', 'Not specified')}
Region:       {buyer_context.get('region', 'Not specified')}

CRITICAL:
Every argument must be specific to this
organization's context and requirements.
Reference the company name and industry
directly in your reasoning.
"""
