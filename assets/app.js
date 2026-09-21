/* IRAP app shell: routing, rendering, and local persistence.
   Plain JS, no framework — full re-render on state change (except free-text
   inputs, which patch state in place so focus/caret aren't lost). */

const STORAGE_KEY = "irap_assessments_v1";
const STEP_ORDER = ["basics", ...CATEGORIES.map((c) => c.id), "review"];
const STEP_LABELS = { basics: "Basics", review: "Review" };
CATEGORIES.forEach((c) => (STEP_LABELS[c.id] = c.short));

const state = {
  view: "landing", // landing | intake | results | resources
  resourceTab: "basics",
  wizard: {
    step: 0,
    basics: { airportName: "", airportCode: "", assessorName: "", assessorRole: "" },
    answers: {},
    validationError: false,
  },
  currentResultId: null,
};

/* ---------- Persistence ---------- */
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    /* ignore quota/availability errors — demo still works in-memory */
  }
}

function saveAssessment(record) {
  const list = loadSaved();
  list.unshift(record);
  saveAll(list);
}

function deleteAssessment(id) {
  const list = loadSaved().filter((r) => r.id !== id);
  saveAll(list);
}

/* ---------- Helpers ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function resetWizard() {
  state.wizard = {
    step: 0,
    basics: { airportName: "", airportCode: "", assessorName: "", assessorRole: "" },
    answers: {},
    validationError: false,
  };
}

function navigate(view, opts) {
  state.view = view;
  if (opts && opts.resultId) state.currentResultId = opts.resultId;
  render();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ---------- Validation ---------- */
function isBasicsValid() {
  return state.wizard.basics.airportName.trim() && state.wizard.basics.assessorName.trim();
}

function isCategoryStepValid(catId) {
  const questions = QUESTIONS[catId].filter((q) => q.required);
  return questions.every((q) => {
    const v = state.wizard.answers[q.id];
    if (q.type === "multiselect") return Array.isArray(v) && v.length > 0;
    return !!v;
  });
}

function isStepValid(stepId) {
  if (stepId === "basics") return isBasicsValid();
  if (stepId === "review") return true;
  return isCategoryStepValid(stepId);
}

/* ---------- Rendering: shell ---------- */
function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    ${renderTopNav()}
    <main class="page ${state.view === "landing" || state.view === "resources" ? "wide" : ""}">
      ${
        state.view === "landing"
          ? renderLanding()
          : state.view === "intake"
          ? renderIntake()
          : state.view === "results"
          ? renderResults()
          : renderResources()
      }
    </main>
    <footer class="app-footer">IRAP — Interactive Readiness-Assessment Platform · Prototype for demonstration purposes</footer>
  `;
}

function renderTopNav() {
  const tab = (view, label) =>
    `<button data-action="nav" data-view="${view}" class="${state.view === view ? "active" : ""}">${label}</button>`;
  return `
    <div class="topnav">
      <div class="brand" data-action="nav" data-view="landing">
        <div class="mark">IR</div>
        <div>
          IRAP
          <span class="sub">Readiness Assessment</span>
        </div>
      </div>
      <nav>
        ${tab("landing", "Home")}
        <button data-action="new-assessment" class="${state.view === "intake" ? "active" : ""}">New Assessment</button>
        ${tab("resources", "Resources")}
      </nav>
    </div>
  `;
}

/* ---------- Landing ---------- */
function renderLanding() {
  const saved = loadSaved();
  return `
    <div class="hero">
      <div class="eyebrow">Advanced Air Mobility · Readiness Diagnostic</div>
      <h1>Is your airport ready for Advanced Air Mobility?</h1>
      <p>IRAP is a guided self-assessment that helps regional and small airport staff evaluate AAM/eVTOL readiness using information you already have on hand — no engineering survey required.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="new-assessment">${icon("plus", 16)} Start New Assessment</button>
        <button class="btn btn-secondary" data-action="nav" data-view="resources" style="background:transparent;border-color:rgba(255,255,255,0.3);color:#fff;">Learn about AAM</button>
      </div>
    </div>

    <div class="section-heading"><h2>What this assessment covers</h2></div>
    <div class="feature-grid">
      ${CATEGORIES.map(
        (c) => `
        <div class="feature-card">
          <div class="icon-badge">${icon(c.icon, 20)}</div>
          <h3>${c.title}</h3>
          <p>${c.blurb}</p>
        </div>`
      ).join("")}
    </div>

    <div class="section-heading">
      <h2>Saved assessments</h2>
      ${saved.length ? `<button class="btn btn-secondary" data-action="new-assessment">${icon("plus", 14)} New</button>` : ""}
    </div>
    ${
      saved.length === 0
        ? `<div class="empty-state">No assessments yet. Start one above to see your results dashboard.</div>`
        : `<div class="saved-list">
            ${saved
              .map(
                (r) => `
              <div class="saved-item">
                <div class="info">
                  <div>
                    <div class="name">${escapeHtml(r.airportName)}</div>
                    <div class="meta">${r.assessorName ? escapeHtml(r.assessorName) + " · " : ""}${fmtDate(r.date)}</div>
                  </div>
                  <span class="tier-badge ${r.result.overallTier.className}"><span class="dot"></span>${r.result.overallTier.label} · ${r.result.overallPct}%</span>
                </div>
                <div class="actions">
                  <button class="btn btn-secondary" data-action="view-result" data-id="${r.id}">${icon("eye", 14)} View</button>
                  <button class="btn-danger-ghost" data-action="delete-result" data-id="${r.id}">${icon("trash", 14)}</button>
                </div>
              </div>`
              )
              .join("")}
          </div>`
    }
  `;
}

/* ---------- Intake wizard ---------- */
function renderIntake() {
  const stepId = STEP_ORDER[state.wizard.step];
  return `
    <div class="intake-header">
      <h1>New Readiness Assessment</h1>
      <p>Answer each section using information you already know. You can go back and change anything before submitting.</p>
    </div>
    <div class="stepper">
      ${STEP_ORDER.map((s, i) => {
        const cls = i === state.wizard.step ? "current" : i < state.wizard.step ? "done" : "";
        return `<div class="step-pill ${cls}" data-action="goto-step" data-step="${i}">${STEP_LABELS[s]}</div>`;
      }).join("")}
    </div>
    <div class="card form-card">
      ${stepId === "basics" ? renderBasicsStep() : stepId === "review" ? renderReviewStep() : renderCategoryStep(stepId)}
    </div>
  `;
}

function renderBasicsStep() {
  const b = state.wizard.basics;
  return `
    <div class="form-card-head">
      <div class="icon-badge">${icon("plane", 20)}</div>
      <h2>Airport & Assessor Info</h2>
    </div>
    <div class="category-blurb">This information is only used to label your results — it isn't scored.</div>
    <div class="field">
      <label class="q-label">Airport name <span class="required-flag">required</span></label>
      <input type="text" class="q-text-input" data-basics-field="airportName" value="${escapeAttr(b.airportName)}" placeholder="e.g. Cedar Valley Regional Airport" />
    </div>
    <div class="field">
      <label class="q-label">Airport identifier / code</label>
      <input type="text" class="q-text-input" data-basics-field="airportCode" value="${escapeAttr(b.airportCode)}" placeholder="e.g. KCVR" />
    </div>
    <div class="field">
      <label class="q-label">Your name <span class="required-flag">required</span></label>
      <input type="text" class="q-text-input" data-basics-field="assessorName" value="${escapeAttr(b.assessorName)}" placeholder="e.g. Jordan Alvarez" />
    </div>
    <div class="field">
      <label class="q-label">Your role / title</label>
      <input type="text" class="q-text-input" data-basics-field="assessorRole" value="${escapeAttr(b.assessorRole)}" placeholder="e.g. Airport Manager" />
    </div>
    ${renderFormNav("basics")}
  `;
}

function renderCategoryStep(catId) {
  const cat = CATEGORIES.find((c) => c.id === catId);
  const questions = QUESTIONS[catId];
  return `
    <div class="form-card-head">
      <div class="icon-badge">${icon(cat.icon, 20)}</div>
      <h2>${cat.title}</h2>
    </div>
    <div class="category-blurb">${cat.blurb}</div>
    ${questions.map((q) => renderQuestion(q)).join("")}
    ${renderFormNav(catId)}
  `;
}

function renderQuestion(q) {
  const answer = state.wizard.answers[q.id];
  let control = "";

  if (q.type === "select") {
    control = `<div class="option-grid">
      ${q.options
        .map(
          (o) => `
        <div class="option-card ${answer === o.value ? "selected" : ""}" data-action="select-option" data-qid="${q.id}" data-value="${o.value}">
          <span class="marker"></span><span>${o.label}</span>
        </div>`
        )
        .join("")}
    </div>`;
  } else if (q.type === "multiselect") {
    const selected = answer || [];
    control = `<div class="option-grid">
      ${q.options
        .map(
          (o) => `
        <div class="option-card multiselect ${selected.includes(o.value) ? "selected" : ""}" data-action="toggle-option" data-qid="${q.id}" data-value="${o.value}">
          <span class="marker"></span><span>${o.label}</span>
        </div>`
        )
        .join("")}
    </div>`;
  } else if (q.type === "text") {
    control = `<textarea class="q-text-input" rows="2" data-qid="${q.id}" placeholder="Optional notes...">${escapeHtml(answer || "")}</textarea>`;
  }

  return `
    <div class="field">
      <label class="q-label">${q.label}${q.required ? '<span class="required-flag">required</span>' : ""}</label>
      ${q.help ? `<div class="q-help">${q.help}</div>` : ""}
      ${control}
    </div>
  `;
}

function renderFormNav(stepId) {
  const idx = STEP_ORDER.indexOf(stepId);
  const isFirst = idx === 0;
  return `
    <div class="form-nav">
      <div>${!isFirst ? `<button class="btn btn-ghost" data-action="prev-step">${icon("arrowleft", 14)} Back</button>` : ""}</div>
      <div class="right">
        <button class="btn btn-primary" data-action="next-step">Continue ${icon("arrowright", 14)}</button>
      </div>
    </div>
    ${state.wizard.validationError ? `<div class="validation-msg">Please answer the required questions above to continue.</div>` : ""}
  `;
}

function renderReviewStep() {
  return `
    <div class="form-card-head">
      <div class="icon-badge">${icon("check", 20)}</div>
      <h2>Review & Submit</h2>
    </div>
    <div class="category-blurb">Double check your answers below, then submit to generate your readiness results.</div>
    ${CATEGORIES.map((cat) => {
      const questions = QUESTIONS[cat.id];
      return `
        <div class="review-cat">
          <h3>${cat.title}</h3>
          ${questions
            .map((q) => {
              const a = state.wizard.answers[q.id];
              let display = "Not answered";
              if (q.type === "select") {
                const opt = q.options.find((o) => o.value === a);
                display = opt ? opt.label : "Not answered";
              } else if (q.type === "multiselect") {
                display = a && a.length ? a.map((v) => (q.options.find((o) => o.value === v) || {}).label).join(", ") : "None selected";
              } else if (q.type === "text") {
                display = a && a.trim() ? a : "—";
              }
              return `<div class="review-row"><span class="q">${q.label}</span><span class="a">${escapeHtml(display)}</span></div>`;
            })
            .join("")}
        </div>
      `;
    }).join("")}
    <div class="form-nav">
      <button class="btn btn-ghost" data-action="prev-step">${icon("arrowleft", 14)} Back</button>
      <div class="right">
        <button class="btn btn-primary" data-action="submit-assessment">Submit & See Results ${icon("arrowright", 14)}</button>
      </div>
    </div>
  `;
}

/* ---------- Results ---------- */
function renderResults() {
  const list = loadSaved();
  const record = list.find((r) => r.id === state.currentResultId);
  if (!record) {
    return `<div class="empty-state">Assessment not found. <button class="btn btn-secondary" data-action="nav" data-view="landing">Back to Home</button></div>`;
  }
  const result = record.result;

  return `
    <div class="results-header">
      <div>
        <div class="who">${result.overallTier.label.toUpperCase()} READINESS ASSESSMENT</div>
        <h1>${escapeHtml(record.airportName)}</h1>
        <div class="who" style="margin-top:6px;">${record.assessorName ? escapeHtml(record.assessorName) + (record.assessorRole ? " · " + escapeHtml(record.assessorRole) : "") + " · " : ""}${fmtDate(record.date)}</div>
      </div>
      <div class="overall-score">
        <div class="score-ring" style="background:conic-gradient(${tierColor(result.overallTier)} ${result.overallPct * 3.6}deg, var(--slate-100) 0deg);">
          <div style="background:var(--white);width:68px;height:68px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${result.overallPct}%</div>
        </div>
        <div>
          <div class="tier-badge ${result.overallTier.className}"><span class="dot"></span>${result.overallTier.label}</div>
          <div style="font-size:12.5px;color:var(--slate-400);margin-top:6px;max-width:180px;">Overall readiness across all five categories</div>
        </div>
      </div>
    </div>

    <div class="section-heading"><h2>Category breakdown</h2></div>
    <div class="category-grid">
      ${result.categories
        .map(
          (c) => `
        <div class="cat-card">
          <div class="cat-card-top">
            <div class="left">
              <div class="icon-badge">${icon(c.icon, 18)}</div>
              <h3>${c.title}</h3>
            </div>
          </div>
          <div class="tier-badge ${c.tier.className}"><span class="dot"></span>${c.tier.label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${c.pct}%;background:${tierColor(c.tier)};"></div></div>
          <div class="pct">${c.pct}% · ${c.earned}/${c.max} points</div>
          <div class="blurb-toggle">${c.blurb}</div>
        </div>`
        )
        .join("")}
    </div>

    <div class="section-heading"><h2>Strengths & Gaps</h2></div>
    <div class="two-col">
      <div class="list-card strengths">
        <h3>${icon("check", 16)} Key strengths</h3>
        ${
          result.strengths.length
            ? `<ul>${result.strengths.map((s) => `<li><span class="cat-tag">${s.category}</span>${s.label} — <strong>${escapeHtml(s.answer)}</strong></li>`).join("")}</ul>`
            : `<div class="empty-state" style="padding:16px;">No standout strengths identified yet — that's common for an early-stage assessment.</div>`
        }
      </div>
      <div class="list-card gaps">
        <h3>Key gaps</h3>
        ${
          result.gaps.length
            ? `<ul>${result.gaps.map((g) => `<li><span class="cat-tag">${g.category}</span>${g.label} — <strong>${escapeHtml(g.answer)}</strong></li>`).join("")}</ul>`
            : `<div class="empty-state" style="padding:16px;">No major gaps identified — strong result across the board.</div>`
        }
      </div>
    </div>

    <div class="section-heading"><h2>Current barriers</h2></div>
    <div class="list-card barriers">
      ${
        result.barriers.length
          ? `<ul>${result.barriers.map((b) => `<li>${escapeHtml(b.text)}</li>`).join("")}</ul>`
          : `<div class="empty-state" style="padding:16px;">No significant barriers flagged based on your answers.</div>`
      }
    </div>

    <div class="section-heading"><h2>Priority next actions</h2></div>
    <div class="list-card actions">
      ${
        result.actions.length
          ? `<ol>${result.actions.map((a) => `<li>${escapeHtml(a.text)}</li>`).join("")}</ol>`
          : `<div class="empty-state" style="padding:16px;">No specific actions flagged — you're in good shape to move to detailed planning.</div>`
      }
    </div>

    ${renderNotes(record)}

    <div class="results-actions">
      <button class="btn btn-secondary" data-action="nav" data-view="landing">${icon("home", 14)} Back to Home</button>
      <button class="btn btn-secondary" data-action="print">${icon("download", 14)} Print / Save Summary</button>
      <button class="btn btn-primary" data-action="new-assessment">${icon("plus", 14)} Start New Assessment</button>
    </div>
  `;
}

function renderNotes(record) {
  const notesQuestions = [];
  CATEGORIES.forEach((cat) => {
    QUESTIONS[cat.id]
      .filter((q) => q.type === "text")
      .forEach((q) => {
        const val = record.answers[q.id];
        if (val && val.trim()) notesQuestions.push({ cat: cat.short, label: q.label, val });
      });
  });
  if (!notesQuestions.length) return "";
  return `
    <div class="section-heading"><h2>Notes from your team</h2></div>
    <div class="list-card notes-section">
      ${notesQuestions
        .map(
          (n) => `<div class="note-block"><span class="cat-tag">${n.cat}</span><p>"${escapeHtml(n.val)}"</p></div>`
        )
        .join("")}
    </div>
  `;
}

function tierColor(tier) {
  const map = {
    "tier-early": "var(--tier-early)",
    "tier-emerging": "var(--tier-emerging)",
    "tier-developing": "var(--tier-developing)",
    "tier-strong": "var(--tier-strong)",
  };
  return map[tier.className] || "var(--teal-600)";
}

/* ---------- Resources ---------- */
function renderResources() {
  const tabs = [
    { id: "basics", label: "AAM Basics" },
    { id: "funding", label: "Funding Pathways" },
  ];
  return `
    <div class="intake-header">
      <h1>Resources & Learn More</h1>
      <p>Background reading to support your readiness conversation. Placeholder educational content for this prototype.</p>
    </div>
    <div class="resource-tabs">
      ${tabs
        .map(
          (t) =>
            `<button class="${state.resourceTab === t.id ? "active" : ""}" data-action="resource-tab" data-tab="${t.id}">${t.label}</button>`
        )
        .join("")}
    </div>
    <span class="placeholder-tag">Placeholder content</span>
    ${RESOURCES_CONTENT[state.resourceTab]
      .map((c) => `<div class="resource-card"><h3>${c.title}</h3><p>${c.body}</p></div>`)
      .join("")}
  `;
}

/* ---------- Escaping ---------- */
function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

/* ---------- Event delegation ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "nav") {
    navigate(el.dataset.view);
  } else if (action === "new-assessment") {
    resetWizard();
    navigate("intake");
  } else if (action === "goto-step") {
    state.wizard.step = parseInt(el.dataset.step, 10);
    state.wizard.validationError = false;
    render();
  } else if (action === "prev-step") {
    state.wizard.step = Math.max(0, state.wizard.step - 1);
    state.wizard.validationError = false;
    render();
  } else if (action === "next-step") {
    const stepId = STEP_ORDER[state.wizard.step];
    if (!isStepValid(stepId)) {
      state.wizard.validationError = true;
      render();
      return;
    }
    state.wizard.validationError = false;
    state.wizard.step = Math.min(STEP_ORDER.length - 1, state.wizard.step + 1);
    render();
  } else if (action === "select-option") {
    state.wizard.answers[el.dataset.qid] = el.dataset.value;
    render();
  } else if (action === "toggle-option") {
    const qid = el.dataset.qid;
    const val = el.dataset.value;
    const current = state.wizard.answers[qid] || [];
    state.wizard.answers[qid] = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    render();
  } else if (action === "submit-assessment") {
    const result = computeAssessment(state.wizard.answers);
    const record = {
      id: uid(),
      date: new Date().toISOString(),
      airportName: state.wizard.basics.airportName.trim() || "Untitled Airport",
      airportCode: state.wizard.basics.airportCode.trim(),
      assessorName: state.wizard.basics.assessorName.trim(),
      assessorRole: state.wizard.basics.assessorRole.trim(),
      answers: { ...state.wizard.answers },
      result,
    };
    saveAssessment(record);
    navigate("results", { resultId: record.id });
  } else if (action === "view-result") {
    navigate("results", { resultId: el.dataset.id });
  } else if (action === "delete-result") {
    deleteAssessment(el.dataset.id);
    render();
  } else if (action === "resource-tab") {
    state.resourceTab = el.dataset.tab;
    render();
  } else if (action === "print") {
    window.print();
  }
});

document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.matches("[data-basics-field]")) {
    state.wizard.basics[el.dataset.basicsField] = el.value;
  } else if (el.matches("textarea.q-text-input[data-qid]")) {
    state.wizard.answers[el.dataset.qid] = el.value;
  }
});

render();
