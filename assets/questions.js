/* IRAP question bank and category metadata.
   Every option carries an explicit `score` (0-3) so the scoring engine
   in scoring.js stays a transparent, auditable lookup — no hidden model. */

const CATEGORIES = [
  {
    id: "demand",
    title: "Demand & Public Value",
    short: "Demand",
    icon: "trending-up",
    blurb:
      "AAM services only make sense where there's a real need — enough nearby population, a meaningful gap versus existing transport options, and at least one plausible use case (cargo, medical, passenger, tourism, or emergency response). This category estimates whether the public-value case is there.",
  },
  {
    id: "strategic",
    title: "Strategic Fit & Community Context",
    short: "Strategic Fit",
    icon: "handshake",
    blurb:
      "Even a technically capable airport will struggle to advance AAM without local political and community alignment. This category looks at whether AAM connects to an existing economic priority, whether leadership is engaged, and how the community is likely to react.",
  },
  {
    id: "technical",
    title: "Technical & Infrastructure Readiness",
    short: "Infrastructure",
    icon: "wrench",
    blurb:
      "This is the physical starting point: available apron or pad space, existing helicopter-capable infrastructure, power supply, and obstruction clearance. None of this needs to be engineering-grade yet — just a realistic read on what you already have.",
  },
  {
    id: "sustainability",
    title: "Sustainability & Environmental Factors",
    short: "Sustainability",
    icon: "leaf",
    blurb:
      "Noise-sensitive neighbors and unaddressed environmental constraints are two of the most common reasons AAM projects stall. Flagging these early — and connecting to any regional clean-transportation goals — makes the eventual review process far smoother.",
  },
  {
    id: "operations",
    title: "Current Operations",
    short: "Operations",
    icon: "plane",
    blurb:
      "Your airport's existing classification, traffic volume, and staffing capacity shape how much operational and administrative bandwidth is available to take on a new type of activity. This context grounds the rest of the assessment.",
  },
];

const QUESTIONS = {
  demand: [
    {
      id: "population",
      type: "select",
      label: "Estimated population within a 30–45 minute drive of the airport",
      help: "A rough estimate is fine — use your regional planning commission's figures or a general sense of your service area.",
      required: true,
      options: [
        { value: "under25k", label: "Under 25,000", score: 0 },
        { value: "25k_100k", label: "25,000 – 100,000", score: 1 },
        { value: "100k_500k", label: "100,000 – 500,000", score: 2 },
        { value: "over500k", label: "500,000+", score: 3 },
      ],
    },
    {
      id: "altTransportDistance",
      type: "select",
      label:
        "Distance to the nearest major airport or interstate/highway alternative",
      help: "Longer distances to alternatives generally mean a stronger case for a new mobility option.",
      required: true,
      options: [
        { value: "under15", label: "Less than 15 miles", score: 0 },
        { value: "15_40", label: "15 – 40 miles", score: 1 },
        { value: "40_75", label: "40 – 75 miles", score: 2 },
        { value: "over75", label: "75+ miles, or limited by geography/terrain", score: 3 },
      ],
    },
    {
      id: "useCases",
      type: "multiselect",
      label: "Which AAM use cases seem plausible for your airport?",
      help: "Select all that apply. More plausible use cases generally mean a more resilient business case.",
      required: true,
      maxScore: 3,
      options: [
        { value: "cargo", label: "Cargo / logistics" },
        { value: "medical", label: "Medical / medevac / organ transport" },
        { value: "passenger", label: "Passenger / commuter" },
        { value: "tourism", label: "Tourism / sightseeing" },
        { value: "emergency", label: "Emergency management / disaster response" },
        { value: "agriculture", label: "Agriculture or other commercial use" },
      ],
    },
    {
      id: "anchorUser",
      type: "select",
      label: "Is there an identified anchor user or interested tenant?",
      help: "An anchor user (a hospital network, logistics company, tourism operator, etc.) makes the case for investment much stronger.",
      required: true,
      options: [
        { value: "not_explored", label: "Not explored yet", score: 0 },
        { value: "informal", label: "Exploring informally", score: 1 },
        { value: "formal", label: "Formal interest expressed", score: 2 },
        { value: "loi", label: "Signed LOI or agreement in progress", score: 3 },
      ],
    },
    {
      id: "transportationGapNote",
      type: "text",
      label:
        "In a sentence or two, what's the biggest local transportation gap AAM could address?",
      help: "Optional, but helpful context for the results summary.",
      required: false,
    },
  ],

  strategic: [
    {
      id: "economicAlignment",
      type: "select",
      label: "How well does AAM align with your region's economic development priorities?",
      required: true,
      options: [
        { value: "not_aligned", label: "Not aligned / unsure", score: 0 },
        { value: "somewhat", label: "Somewhat aligned", score: 1 },
        { value: "aligned", label: "Aligned with a general priority", score: 2 },
        { value: "strongly", label: "Strongly aligned with a named regional priority", score: 3 },
      ],
    },
    {
      id: "transportationGaps",
      type: "multiselect",
      label: "Which existing transportation gaps affect your region?",
      help: "Select all that apply.",
      required: true,
      maxScore: 3,
      excludeFromScore: ["none"],
      options: [
        { value: "highway", label: "Limited highway access" },
        { value: "rail", label: "No or limited rail service" },
        { value: "seasonal", label: "Seasonal road closures (weather, terrain)" },
        { value: "healthcare", label: "Healthcare access gaps" },
        { value: "emergency_response", label: "Long emergency response times" },
        { value: "none", label: "None significant" },
      ],
    },
    {
      id: "communitySupport",
      type: "select",
      label: "How would you characterize community awareness and support for AAM?",
      required: true,
      options: [
        { value: "opposition", label: "Some opposition has already surfaced", score: 0 },
        { value: "limited", label: "Limited awareness so far", score: 1 },
        { value: "mixed", label: "Mixed / neutral", score: 2 },
        { value: "broad", label: "Broad support", score: 3 },
      ],
    },
    {
      id: "leadershipEngagement",
      type: "select",
      label: "Is airport leadership or local government actively exploring AAM?",
      required: true,
      options: [
        { value: "no", label: "No", score: 0 },
        { value: "considering", label: "Considering it", score: 1 },
        { value: "active", label: "Actively exploring", score: 2 },
        { value: "formal", label: "Formal initiative or working group underway", score: 3 },
      ],
    },
    {
      id: "economicPriorityNote",
      type: "text",
      label: "What local economic priority could AAM support? (e.g. tourism growth, healthcare access, freight efficiency)",
      required: false,
    },
  ],

  technical: [
    {
      id: "apronSpace",
      type: "select",
      label: "How much underused apron, pad, or heliport space do you have?",
      help: "Think old cargo pads, unused corners of the GA apron, or retired heliport space.",
      required: true,
      options: [
        { value: "none", label: "None identified", score: 0 },
        { value: "small", label: "Less than 0.5 acres", score: 1 },
        { value: "medium", label: "0.5 – 2 acres", score: 2 },
        { value: "large", label: "More than 2 acres", score: 3 },
      ],
    },
    {
      id: "helicopterInfra",
      type: "select",
      label: "What existing helicopter-capable infrastructure do you have?",
      required: true,
      options: [
        { value: "none", label: "None", score: 0 },
        { value: "fuel_only", label: "Fuel only", score: 1 },
        { value: "pad_no_charging", label: "Pad and fuel, no electrical charging capability", score: 2 },
        { value: "full", label: "Full helipad with support infrastructure", score: 3 },
      ],
    },
    {
      id: "powerCapacity",
      type: "select",
      label: "How would you describe your electrical power supply capacity?",
      help: "A rough sense from your facilities team or last utility bill is enough.",
      required: true,
      options: [
        { value: "constrained", label: "Known to be constrained", score: 0 },
        { value: "unknown", label: "Unknown / likely constrained", score: 1 },
        { value: "adequate", label: "Adequate for current operations only", score: 2 },
        { value: "high", label: "Recently upgraded / high capacity", score: 3 },
      ],
    },
    {
      id: "obstructionClearance",
      type: "select",
      label: "What's the state of obstruction / approach clearance around potential sites?",
      required: true,
      options: [
        { value: "significant", label: "Significant known obstructions", score: 0 },
        { value: "unknown", label: "Unknown / not assessed", score: 1 },
        { value: "some", label: "Some minor obstructions known", score: 2 },
        { value: "clear", label: "Clear approach and departure paths", score: 3 },
      ],
    },
    {
      id: "infraNote",
      type: "text",
      label: "Any other infrastructure notes worth capturing?",
      required: false,
    },
  ],

  sustainability: [
    {
      id: "noiseSensitivity",
      type: "select",
      label: "How noise-sensitive is the area surrounding the airport?",
      required: true,
      options: [
        { value: "residential", label: "Residential / noise-sensitive", score: 0 },
        { value: "mixed", label: "Mixed use — moderate sensitivity", score: 1 },
        { value: "commercial", label: "Mostly commercial / industrial", score: 2 },
        { value: "rural", label: "Rural / low sensitivity", score: 3 },
      ],
    },
    {
      id: "environmentalReview",
      type: "select",
      label: "What's the status of environmental review or known environmental constraints?",
      required: true,
      options: [
        { value: "significant", label: "Significant known constraints (wetlands, protected species, etc.)", score: 0 },
        { value: "unknown", label: "Unknown / not yet assessed", score: 1 },
        { value: "minor", label: "Some minor constraints identified", score: 2 },
        { value: "clear", label: "Recent environmental review completed, no major constraints", score: 3 },
      ],
    },
    {
      id: "sustainabilityGoals",
      type: "select",
      label: "Does your municipality or region have clean-transportation or climate goals?",
      required: true,
      options: [
        { value: "no", label: "No / unsure", score: 0 },
        { value: "informal", label: "Informal interest only", score: 1 },
        { value: "adopted", label: "Yes, adopted goals", score: 2 },
        { value: "aam_named", label: "Yes, with AAM or eVTOL specifically referenced", score: 3 },
      ],
    },
  ],

  operations: [
    {
      id: "airportType",
      type: "select",
      label: "How would you classify your airport?",
      required: true,
      options: [
        { value: "minimal_ga", label: "Minimal / seasonal general aviation airport", score: 0 },
        { value: "active_ga", label: "Active general aviation airport", score: 1 },
        { value: "reliever", label: "Reliever or regional airport", score: 2 },
        { value: "commercial", label: "Commercial service or joint-use airport", score: 3 },
      ],
    },
    {
      id: "trafficVolume",
      type: "select",
      label: "Approximate annual aircraft operations (takeoffs + landings)",
      required: true,
      options: [
        { value: "under10k", label: "Under 10,000", score: 0 },
        { value: "10k_50k", label: "10,000 – 50,000", score: 1 },
        { value: "50k_150k", label: "50,000 – 150,000", score: 2 },
        { value: "over150k", label: "150,000+", score: 3 },
      ],
    },
    {
      id: "gaCargoActivity",
      type: "select",
      label: "Level of existing GA / cargo activity at the airport",
      required: true,
      options: [
        { value: "minimal", label: "Minimal", score: 0 },
        { value: "moderate", label: "Moderate", score: 1 },
        { value: "significant", label: "Significant", score: 2 },
        { value: "significant_cargo", label: "Significant, with dedicated cargo operations", score: 3 },
      ],
    },
    {
      id: "staffingCapacity",
      type: "select",
      label: "Airport staffing / operations capacity",
      required: true,
      options: [
        { value: "part_time", label: "Part-time or on-call staff only", score: 0 },
        { value: "small_full_time", label: "Small full-time staff", score: 1 },
        { value: "full_ops", label: "Full operations & maintenance staff", score: 2 },
        { value: "full_plus_planning", label: "Full staff plus planning / engineering capacity", score: 3 },
      ],
    },
  ],
};
