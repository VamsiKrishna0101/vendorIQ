// Mock data for VendorIQ — Enterprise AI Decision Intelligence Platform

export interface Agent {
  id: string;
  name: string;
  role: string;
  group: 'decision' | 'customer' | 'adversarial' | 'analyst';
  initials: string;
  personality: string;
  icon?: string;
}

export interface DebateSession {
  id: string;
  title: string;
  vendors: string[];
  status: 'completed' | 'processing' | 'failed';
  rounds: number;
  confidence: number;
  date: string;
  duration: string;
  winner: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export const MOCK_AGENTS: Agent[] = [
  // Decision Committee
  { id: 'cfo', name: 'CFO Agent', role: 'Chief Financial Officer', group: 'decision', initials: 'CF', personality: 'Cost-aggressive' },
  { id: 'cto', name: 'CTO Agent', role: 'Chief Technology Officer', group: 'decision', initials: 'CT', personality: 'Innovation-driven' },
  { id: 'legal', name: 'Legal Agent', role: 'General Counsel', group: 'decision', initials: 'LC', personality: 'Risk-averse' },
  { id: 'operations', name: 'Operations Agent', role: 'COO', group: 'decision', initials: 'OP', personality: 'Efficiency-focused' },
  { id: 'enterprise_arch', name: 'Architect Agent', role: 'Enterprise Architect', group: 'decision', initials: 'EA', personality: 'Systems-thinker' },
  { id: 'procurement', name: 'Procurement Agent', role: 'Head of Procurement', group: 'decision', initials: 'PR', personality: 'Negotiation-oriented' },
  { id: 'digital_lead', name: 'Digital Lead Agent', role: 'Digital Transformation Lead', group: 'decision', initials: 'DL', personality: 'Change-catalyst' },
  // Customer Panel
  { id: 'positive_rep', name: 'Positive Rep', role: 'Satisfied Customer', group: 'customer', initials: 'P+', personality: 'Advocate' },
  { id: 'negative_rep', name: 'Negative Rep', role: 'Dissatisfied Customer', group: 'customer', initials: 'N-', personality: 'Critic' },
  { id: 'neutral_rep', name: 'Neutral Rep', role: 'Objective Observer', group: 'customer', initials: 'N=', personality: 'Balanced' },
  // Adversarial Audit
  { id: 'devils_advocate', name: "Devil's Advocate", role: 'Contrarian Auditor', group: 'adversarial', initials: 'DA', personality: 'Contrarian' },
  { id: 'bias_detector', name: 'Bias Detector', role: 'Cognitive Bias Analyst', group: 'adversarial', initials: 'BD', personality: 'Analytical' },
  { id: 'governance', name: 'Governance Auditor', role: 'Compliance & Governance', group: 'adversarial', initials: 'GA', personality: 'Rule-enforcer' },
];

export const MOCK_ANALYSTS = [
  { id: 'financial', name: 'Financial Analyst', icon: 'DollarSign', streamText: 'Scanning pricing structures, TCO models, and ROI projections across all vendor proposals. Identifying hidden cost escalation clauses and payment schedule risks...' },
  { id: 'technical', name: 'Technical Analyst', icon: 'Cpu', streamText: 'Extracting scalability architecture claims, API specifications, and infrastructure requirements. Cross-referencing SLA commitments against industry benchmarks...' },
  { id: 'compliance', name: 'Compliance Analyst', icon: 'Shield', streamText: 'Parsing compliance certifications: SOC 2, ISO 27001, GDPR, HIPAA. Flagging jurisdiction-specific regulatory obligations and data residency requirements...' },
  { id: 'market', name: 'Market Analyst', icon: 'TrendingUp', streamText: 'Analyzing vendor market position, financial stability indicators, and competitive landscape. Assessing M&A risk and long-term viability signals...' },
  { id: 'customer_intel', name: 'Customer Intelligence', icon: 'Users', streamText: 'Aggregating customer sentiment from public sources, case studies, and analyst reports. Building satisfaction score matrices across industry verticals...' },
];

export const MOCK_STREAMING_TEXTS: Record<string, string[]> = {
  cfo: [
    "Total cost of ownership analysis across 5-year horizon reveals significant variance between vendors. AWS presents 23% lower infrastructure costs but 41% higher operational overhead. Factoring in migration costs of $2.3M, the break-even point occurs at month 18. Recommend prioritizing vendors with transparent pricing models and volume discount commitments.",
    "Working capital implications of vendor lock-in scenarios present material financial risk. Contract exit clauses must be evaluated against projected switching costs estimated at 15-20% of annual contract value.",
  ],
  cto: [
    "Technical architecture assessment indicates critical API compatibility gaps with existing ERP stack. Vendor A's microservices approach reduces integration complexity by approximately 60% but introduces new runtime dependencies. Performance benchmarks under enterprise load conditions show 340ms average response latency — within acceptable SLA parameters.",
    "Cloud-native architecture with Kubernetes orchestration provides superior scalability. The proposed solution handles 10x traffic spikes without manual intervention. Security posture assessment: 94/100 against NIST CSF framework.",
  ],
  legal: [
    "Contract review identified 7 non-standard clauses requiring negotiation. Intellectual property provisions in Section 12.3 create ambiguous ownership of derived data models — this must be resolved before execution. Liability caps set at 12 months contract value are below industry standard of 24 months. GDPR Article 28 DPA requirements are partially addressed.",
    "Force majeure provisions are overly broad and could be invoked in scenarios that constitute normal business operations. Dispute resolution mechanisms defaulting to vendor's jurisdiction creates enforcement risk.",
  ],
  operations: [
    "Operational readiness assessment: implementation timeline of 90 days is aggressive given current resource constraints. Team capacity analysis indicates 40% of projected integration hours conflict with Q3 product launch commitments. Vendor's dedicated implementation team is a mitigating factor.",
    "Change management requirements are underestimated. Based on organizational complexity, realistic adoption timeline is 6-9 months for full operational proficiency. Training investment of $180K should be factored into total cost calculation.",
  ],
  enterprise_arch: [
    "Enterprise architecture compatibility score: 7.8/10. The proposed integration pattern follows event-driven architecture principles compatible with our existing middleware layer. Identified 3 technical debt items that must be resolved pre-migration. Data model mapping complexity is HIGH — recommend dedicated 2-week discovery sprint.",
    "API versioning strategy creates backward compatibility risk. Vendor's deprecation policy gives 6-month notice — insufficient for enterprise change cycles that average 9-12 months. Escalate to vendor for contractual SLA on API stability.",
  ],
  procurement: [
    "Commercial negotiation position is favorable. Vendor is approaching Q2 quota close — leverage timing to secure 15-18% discount on list price. Volume commitments at 500 seats unlocks additional tier pricing. Multi-year commitment of 3 years provides maximum leverage but requires executive sign-off given capital commitment.",
    "Reference customer program participation can yield additional concessions including extended pilot period, dedicated success resources, and early access to roadmap features. Recommend using this as negotiation currency.",
  ],
  digital_lead: [
    "Digital transformation alignment score: HIGH. The vendor's platform accelerates our 2025 modernization objectives by an estimated 18 months. API-first architecture enables the citizen developer program critical to our digital initiative. Change velocity assessment indicates this vendor's deployment cadence (weekly releases) aligns with our agile transformation goals.",
  ],
  devils_advocate: [
    "CHALLENGE RAISED: The committee's enthusiasm for Vendor A reflects classic availability bias — we evaluated this vendor first and most extensively. I submit that Vendor C has not received equivalent scrutiny. Furthermore, the 18-month ROI projection assumes 100% adoption — historically, enterprise software achieves 60-70% adoption at 24 months. The financial case may be materially overstated.",
  ],
  bias_detector: [
    "BIAS ALERT: Anchoring bias detected in CFO analysis. The $2.3M migration cost figure was provided by Vendor A's sales team and has not been independently verified. Additionally, confirmation bias may be influencing the technical evaluation — 3 of 5 evaluation criteria were selected post-demo and appear tailored to Vendor A's strengths.",
  ],
  governance: [
    "GOVERNANCE FLAG: Board-level procurement policy requires competitive tender process for contracts exceeding $1M annual value. Current evaluation process does not satisfy the three-quote requirement per policy 4.2.1. Additionally, no conflict of interest declaration has been filed despite two committee members having prior professional relationships with Vendor A leadership.",
  ],
  positive_rep: [
    "Implementation experience exceeded expectations. The vendor's onboarding team provided dedicated support throughout the 60-day implementation. Response times averaged under 2 hours during business hours. The platform has reduced our monthly reporting cycle from 5 days to 6 hours — this alone justified the investment for our team.",
  ],
  negative_rep: [
    "The product demo did not reflect production performance. Post-implementation, we experienced 3 critical outages in the first quarter, each lasting 4-6 hours during business operations. SLA credits were applied but business impact to our customers was not compensated. Escalation process is slow — P1 issues took 8+ hours to reach engineering leadership.",
  ],
  neutral_rep: [
    "The platform meets its stated technical specifications. Performance is adequate under normal operating conditions. The pricing model is transparent and aligns with market rates. Primary concerns are the limited customization options for enterprise-specific workflows and the 12-month roadmap visibility which is shorter than our preferred 18-month planning horizon.",
  ],
};

export const MOCK_SESSIONS: DebateSession[] = [
  {
    id: 'sess-001',
    title: 'Cloud Infrastructure — Q1 Vendor Selection',
    vendors: ['AWS', 'Microsoft Azure', 'Google Cloud'],
    status: 'completed',
    rounds: 3,
    confidence: 87,
    date: '2025-05-10',
    duration: '4m 32s',
    winner: 'Microsoft Azure',
  },
  {
    id: 'sess-002',
    title: 'CRM Platform Evaluation — Sales Division',
    vendors: ['Salesforce', 'HubSpot', 'Microsoft Dynamics'],
    status: 'completed',
    rounds: 3,
    confidence: 91,
    date: '2025-05-08',
    duration: '5m 14s',
    winner: 'Salesforce',
  },
  {
    id: 'sess-003',
    title: 'ERP Modernization — Finance & Operations',
    vendors: ['SAP S/4HANA', 'Oracle Fusion', 'Workday'],
    status: 'completed',
    rounds: 3,
    confidence: 78,
    date: '2025-05-05',
    duration: '6m 08s',
    winner: 'SAP S/4HANA',
  },
  {
    id: 'sess-004',
    title: 'Security Operations Platform',
    vendors: ['CrowdStrike', 'Palo Alto Networks'],
    status: 'completed',
    rounds: 2,
    confidence: 94,
    date: '2025-05-02',
    duration: '3m 45s',
    winner: 'CrowdStrike',
  },
  {
    id: 'sess-005',
    title: 'Data Warehouse Consolidation',
    vendors: ['Snowflake', 'Databricks', 'BigQuery'],
    status: 'failed',
    rounds: 1,
    confidence: 0,
    date: '2025-04-28',
    duration: '1m 12s',
    winner: 'N/A',
  },
  {
    id: 'sess-006',
    title: 'HR Information System Upgrade',
    vendors: ['Workday', 'SAP SuccessFactors', 'ADP'],
    status: 'completed',
    rounds: 3,
    confidence: 83,
    date: '2025-04-25',
    duration: '4m 55s',
    winner: 'Workday',
  },
];

export const MOCK_ACTIVITY_FEED: ActivityEvent[] = [
  { id: '1', timestamp: '14:23:01', message: 'CFO completed Round 1 financial analysis', type: 'success' },
  { id: '2', timestamp: '14:23:04', message: 'CTO flagged API compatibility concern', type: 'warning' },
  { id: '3', timestamp: '14:23:08', message: 'Bias Detector flagged anchoring bias in CFO analysis', type: 'error' },
  { id: '4', timestamp: '14:23:12', message: 'Legal Agent raised IP ownership clause risk', type: 'warning' },
  { id: '5', timestamp: '14:23:15', message: 'Procurement Agent initiated Round 2 negotiation stance', type: 'info' },
  { id: '6', timestamp: '14:23:18', message: 'Governance Auditor raised procurement policy violation', type: 'error' },
  { id: '7', timestamp: '14:23:22', message: 'Customer Positive Rep submitted satisfaction testimony', type: 'success' },
  { id: '8', timestamp: '14:23:26', message: 'Operations Agent updated resource capacity assessment', type: 'info' },
  { id: '9', timestamp: '14:23:30', message: "Devil's Advocate challenged financial projections", type: 'warning' },
  { id: '10', timestamp: '14:23:33', message: 'Enterprise Architect completed compatibility scoring', type: 'success' },
];

export const MOCK_VERDICTS = {
  winner: 'Microsoft Azure',
  confidence: 87,
  vendors: [
    {
      name: 'Microsoft Azure',
      score: 87,
      rank: 1,
      status: 'RECOMMENDED' as const,
      factors: ['Best enterprise integration', 'Competitive TCO', 'Strong compliance posture'],
    },
    {
      name: 'AWS',
      score: 74,
      rank: 2,
      status: 'CONSIDER' as const,
      factors: ['Superior raw performance', 'Highest operational overhead', 'Complex pricing model'],
    },
    {
      name: 'Google Cloud',
      score: 61,
      rank: 3,
      status: 'REJECTED' as const,
      factors: ['Immature enterprise support', 'Limited compliance coverage', 'Integration complexity'],
    },
  ],
  summary: "After three rounds of structured executive debate and adversarial scrutiny, the committee reaches a high-confidence recommendation for Microsoft Azure. The decision is supported by superior enterprise integration capabilities, a favorable 5-year TCO trajectory, and the strongest compliance posture across evaluated dimensions. Legal risks are addressable through standard contract negotiation.",
  tradeoffs: ['Accepting higher initial migration cost for superior long-term operational efficiency', 'Vendor lock-in risk mitigated by contractual exit clause negotiation'],
  risksAcknowledged: ['18-month adoption timeline requires dedicated change management investment', 'API deprecation policy requires contractual SLA reinforcement'],
  dissentingVoice: "Devil's Advocate maintains that evaluation criteria favored Microsoft integration ecosystem — independent validation recommended before final board approval.",
  mostInfluential: 'CFO Agent',
};
