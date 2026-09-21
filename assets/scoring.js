/* IRAP scoring engine.
   Deliberately simple and rule-based (thresholds + lookups, no black box)
   so the result can be explained line-by-line to an airport board. */

const TIERS = [
  { max: 34, label: "Early Stage", className: "tier-early" },
  { max: 59, label: "Emerging Readiness", className: "tier-emerging" },
  { max: 79, label: "Developing Readiness", className: "tier-developing" },
  { max: 100, label: "Strong Readiness", className: "tier-strong" },
];

function tierFor(pct) {
  return TIERS.find((t) => pct <= t.max) || TIERS[TIERS.length - 1];
}

/* Barrier / action rules. Each `test` reads raw answers for one category
   (or the full answer set) and returns true/false — fully inspectable. */
const RULES = [
  {
    category: "technical",
    test: (a) => a.apronSpace === "none",
    barrier: "No underused apron, pad, or heliport space has been identified yet.",
    action:
      "Walk the airfield with your operations team to inventory underused ramp, cargo apron, or retired heliport areas as potential vertiport sites.",
  },
  {
    category: "technical",
    test: (a) => a.powerCapacity === "constrained" || a.powerCapacity === "unknown",
    barrier: "Electrical power supply capacity at the site is constrained or unknown.",
    action:
      "Contact your local utility to request a load capacity assessment for the areas you're considering for AAM use.",
  },
  {
    category: "technical",
    test: (a) => a.obstructionClearance === "significant" || a.obstructionClearance === "unknown",
    barrier: "Obstruction and approach/departure clearance has not been confirmed.",
    action:
      "Commission a basic obstruction and airspace review before committing to a specific site on the airfield.",
  },
  {
    category: "technical",
    test: (a) => a.helicopterInfra === "none",
    barrier: "No existing helicopter-capable infrastructure to build from.",
    action:
      "Evaluate whether existing pavement can be adapted for rotorcraft/eVTOL use, or budget for new pad construction.",
  },
  {
    category: "sustainability",
    test: (a) => a.noiseSensitivity === "residential" && (a.environmentalReview === "significant" || a.environmentalReview === "unknown"),
    barrier: "The surrounding area is noise-sensitive and environmental review has not yet been completed.",
    action:
      "Begin a preliminary noise and environmental screening, and start community engagement early — before a specific site is locked in.",
  },
  {
    category: "sustainability",
    test: (a) => a.environmentalReview === "significant",
    barrier: "Known environmental constraints (e.g. wetlands, protected species) may affect siting.",
    action:
      "Loop in your environmental compliance office or FAA Airports District Office early to scope potential NEPA requirements.",
  },
  {
    category: "strategic",
    test: (a) => a.communitySupport === "opposition",
    barrier: "Some community opposition to AAM or added airport activity has already surfaced.",
    action:
      "Launch a public education and engagement process that directly addresses the concerns already raised, before advancing plans.",
  },
  {
    category: "strategic",
    test: (a) => a.leadershipEngagement === "no",
    barrier: "Airport leadership and local government are not yet engaged on AAM.",
    action:
      "Brief your airport board or council using this readiness assessment as a starting point to build internal support.",
  },
  {
    category: "strategic",
    test: (a) => a.economicAlignment === "not_aligned",
    barrier: "AAM has not yet been connected to a named regional economic priority.",
    action:
      "Review your regional or economic development plan and identify how AAM could support an existing priority (freight, healthcare access, tourism, etc.).",
  },
  {
    category: "demand",
    test: (a) => (a.useCases || []).length === 0,
    barrier: "No specific AAM use case has been identified yet.",
    action:
      "Work through cargo, medical, passenger, tourism, and emergency-response scenarios to identify your strongest-fit use case.",
  },
  {
    category: "demand",
    test: (a) => a.anchorUser === "not_explored",
    barrier: "No anchor user or interested tenant has been identified yet.",
    action:
      "Identify a potential anchor user (a health system, logistics company, or tourism operator) to help build the business case.",
  },
  {
    category: "sustainability",
    test: (a) => a.sustainabilityGoals === "no",
    barrier: null,
    action:
      "Check whether your city, county, or state has adopted climate or clean-transportation goals that AAM could support — this can unlock funding and political support.",
  },
  {
    category: "operations",
    test: (a) => a.staffingCapacity === "part_time",
    barrier: "Limited airport staffing capacity may constrain project management bandwidth.",
    action:
      "Identify a regional planning organization, state DOT aeronautics office, or consultant who can support project development alongside your team.",
  },
];

function scoreSelect(question, value) {
  const opt = question.options.find((o) => o.value === value);
  return opt ? opt.score : 0;
}

function scoreMultiselect(question, values) {
  const list = values || [];
  const excluded = question.excludeFromScore || [];
  const countable = list.filter((v) => !excluded.includes(v));
  const perItem = question.maxScore / 4; // 4 items assumed to reach max
  return Math.min(question.maxScore, +(countable.length * perItem).toFixed(2));
}

function maxScoreFor(question) {
  if (question.type === "select") {
    return Math.max(...question.options.map((o) => o.score));
  }
  if (question.type === "multiselect") {
    return question.maxScore;
  }
  return 0;
}

/**
 * Computes the full assessment result from raw form answers.
 * `answers` is a flat object keyed by question id across all categories.
 */
function computeAssessment(answers) {
  const categoryResults = CATEGORIES.map((cat) => {
    const questions = QUESTIONS[cat.id].filter((q) => q.type !== "text");
    let earned = 0;
    let max = 0;
    const details = [];

    questions.forEach((q) => {
      const qMax = maxScoreFor(q);
      max += qMax;
      let qScore = 0;
      let answerLabel = "";

      if (q.type === "select") {
        qScore = scoreSelect(q, answers[q.id]);
        const opt = q.options.find((o) => o.value === answers[q.id]);
        answerLabel = opt ? opt.label : "Not answered";
      } else if (q.type === "multiselect") {
        qScore = scoreMultiselect(q, answers[q.id]);
        const values = answers[q.id] || [];
        answerLabel = values.length
          ? values
              .map((v) => (q.options.find((o) => o.value === v) || {}).label)
              .filter(Boolean)
              .join(", ")
          : "None selected";
      }

      earned += qScore;
      details.push({
        id: q.id,
        label: q.label,
        answerLabel,
        score: qScore,
        max: qMax,
        ratio: qMax > 0 ? qScore / qMax : 0,
      });
    });

    const pct = max > 0 ? Math.round((earned / max) * 100) : 0;

    return {
      id: cat.id,
      title: cat.title,
      short: cat.short,
      blurb: cat.blurb,
      icon: cat.icon,
      earned,
      max,
      pct,
      tier: tierFor(pct),
      details,
    };
  });

  const overallPct = Math.round(
    categoryResults.reduce((sum, c) => sum + c.pct, 0) / categoryResults.length
  );

  const strengths = [];
  const gaps = [];
  categoryResults.forEach((cat) => {
    cat.details.forEach((d) => {
      if (d.max === 0) return;
      if (d.ratio >= 0.75) {
        strengths.push({ category: cat.short, label: d.label, answer: d.answerLabel });
      } else if (d.ratio <= 0.34) {
        gaps.push({ category: cat.short, label: d.label, answer: d.answerLabel });
      }
    });
  });

  const barriers = [];
  const actions = [];
  RULES.forEach((rule) => {
    if (rule.test(answers)) {
      if (rule.barrier) barriers.push({ category: rule.category, text: rule.barrier });
      if (rule.action) actions.push({ category: rule.category, text: rule.action });
    }
  });

  return {
    overallPct,
    overallTier: tierFor(overallPct),
    categories: categoryResults,
    strengths,
    gaps,
    barriers,
    actions,
  };
}
