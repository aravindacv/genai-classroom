// ============================================================
//  GENAI CLASSROOM — modules/research.js
//  Research Supervisor logic
// ============================================================

const RESEARCH = {

  selectedTool: "structure",
  isRunning:    false,


  // ── Init ──────────────────────────────────────────────────
  init() {
    this._showForm("structure");
    this._updateBtn("structure");
  },


  // ── Select tool ───────────────────────────────────────────
  selectTool(toolId, el) {
    this.selectedTool = toolId;
    document.querySelectorAll(".tool-item").forEach(t => {
      t.classList.remove("selected");
    });
    el.classList.add("selected");
    this._showForm(toolId);
    this._updateBtn(toolId);
  },


  // ── Show correct form ─────────────────────────────────────
  _showForm(toolId) {
    const forms = [
      "form-structure", "form-litreview", "form-methodology",
      "form-writing",   "form-reviewer",  "form-abstract"
    ];
    forms.forEach(f => {
      document.getElementById(f).classList.add("hidden");
    });
    document.getElementById(`form-${toolId}`).classList.remove("hidden");
  },


  // ── Update button label ───────────────────────────────────
  _updateBtn(toolId) {
    const labels = {
      structure:   "Review My Structure ↗",
      litreview:   "Find Literature Gaps ↗",
      methodology: "Advise on Methodology ↗",
      writing:     "Review My Writing ↗",
      reviewer:    "Draft Reviewer Response ↗",
      abstract:    "Generate Abstract ↗"
    };
    document.getElementById("researchBtn").textContent =
      labels[toolId] || "Get Feedback ↗";
  },


  // ── Run ───────────────────────────────────────────────────
  async run() {
    if (this.isRunning) return;

    const btn       = document.getElementById("researchBtn");
    this.isRunning  = true;
    btn.disabled    = true;
    btn.textContent = "Analysing...";

    this._clearOutput();
    this._showTyping();

    let systemPrompt = "";
    let userMessage  = "";

    switch (this.selectedTool) {

      case "structure": {
        const title   = document.getElementById("str-title").value.trim()
          || "Untitled Paper";
        const area    = document.getElementById("str-area").value.trim()
          || "Cybersecurity";
        const venue   = document.getElementById("str-venue").value;
        const content = document.getElementById("str-content").value.trim();
        systemPrompt  = this._promptStructure();
        userMessage   = `Review this research paper:
Title: ${title}
Area: ${area}
Target venue: ${venue}
${content ? `Abstract/Introduction:\n${content}` : "No content provided — give general guidance for this venue."}`;
        break;
      }

      case "litreview": {
        const topic    = document.getElementById("lit-topic").value.trim()
          || "Cybersecurity";
        const approach = document.getElementById("lit-approach").value.trim();
        const papers   = document.getElementById("lit-papers").value.trim();
        systemPrompt   = this._promptLitReview();
        userMessage    = `Find literature gaps for:
Topic: ${topic}
${approach ? `My proposed approach: ${approach}` : ""}
${papers   ? `Papers I know: ${papers}` : ""}`;
        break;
      }

      case "methodology": {
        const problem = document.getElementById("meth-problem").value.trim()
          || "Cybersecurity research problem";
        const type    = document.getElementById("meth-type").value;
        const current = document.getElementById("meth-current").value.trim();
        systemPrompt  = this._promptMethodology();
        userMessage   = `Advise on research methodology:
Problem: ${problem}
Research type: ${type}
${current ? `Current approach: ${current}` : ""}`;
        break;
      }

      case "writing": {
        const section = document.getElementById("write-section").value;
        const content = document.getElementById("write-content").value.trim();
        if (!content) {
          this._removeTyping();
          this._addBlock("Please paste your text in the input box first.");
          this.isRunning  = false;
          btn.disabled    = false;
          this._updateBtn(this.selectedTool);
          return;
        }
        systemPrompt = this._promptWriting(section);
        userMessage  = `Review this ${section} section:\n\n${content}`;
        break;
      }

      case "reviewer": {
        const comment = document.getElementById("rev-comment").value.trim();
        const context = document.getElementById("rev-context").value.trim();
        const tone    = document.getElementById("rev-tone").value;
        if (!comment) {
          this._removeTyping();
          this._addBlock("Please paste the reviewer comment first.");
          this.isRunning  = false;
          btn.disabled    = false;
          this._updateBtn(this.selectedTool);
          return;
        }
        systemPrompt = this._promptReviewer(tone);
        userMessage  = `Help me respond to this reviewer comment:
Comment: ${comment}
${context ? `My context: ${context}` : ""}`;
        break;
      }

      case "abstract": {
        const title   = document.getElementById("abs-title").value.trim()
          || "Research Paper";
        const problem = document.getElementById("abs-problem").value.trim();
        const method  = document.getElementById("abs-method").value.trim();
        const results = document.getElementById("abs-results").value.trim();
        const limit   = document.getElementById("abs-limit").value;
        systemPrompt  = this._promptAbstract();
        userMessage   = `Write an abstract (max ${limit} words):
Title: ${title}
${problem ? `Problem: ${problem}` : ""}
${method  ? `Method: ${method}`   : ""}
${results ? `Results: ${results}` : ""}`;
        break;
      }
    }

    const response = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    this._removeTyping();
    this._renderResponse(response);

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      `Feedback — ${this.selectedTool}`;

    this.isRunning  = false;
    btn.disabled    = false;
    this._updateBtn(this.selectedTool);
  },


  // ── Render response ───────────────────────────────────────
  _renderResponse(text) {
    const feed  = document.getElementById("outputFeed");
    feed.innerHTML = "";
    const block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML = `
      <div class="output-block-label">Supervisor Feedback</div>
      <div class="output-text">${this._formatText(text)}</div>
    `;
    feed.appendChild(block);
  },


  // ── Add simple block ──────────────────────────────────────
  _addBlock(text) {
    const feed  = document.getElementById("outputFeed");
    feed.innerHTML = "";
    const block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML = `
      <div class="output-text" style="color:rgba(245,160,122,0.85);">
        ${text}
      </div>
    `;
    feed.appendChild(block);
  },


  // ── Show typing ───────────────────────────────────────────
  _showTyping() {
    document.getElementById("outputFeed").innerHTML = `
      <div class="output-typing" id="researchTyping">
        <div class="output-typing-dots">
          <span></span><span></span><span></span>
        </div>
        Supervisor is reviewing your work...
      </div>`;
  },


  // ── Remove typing ─────────────────────────────────────────
  _removeTyping() {
    const el = document.getElementById("researchTyping");
    if (el) el.remove();
  },


  // ── Clear output ──────────────────────────────────────────
  _clearOutput() {
    document.getElementById("outputFeed").innerHTML = "";
    document.getElementById("copyBtn").classList.add("hidden");
    document.getElementById("outputTitle").textContent = "Output";
  },


  // ── Copy output ───────────────────────────────────────────
  copyOutput() {
    const text = document.getElementById("outputFeed").innerText;
    navigator.clipboard.writeText(text).then(() => {
      const btn       = document.getElementById("copyBtn");
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = "Copy all"; }, 2000);
    });
  },


  // ── Format text ───────────────────────────────────────────
  _formatText(text) {
    return text
      .split("\n\n")
      .map(p => `<p>${p.replace(/\n/g, "<br>").trim()}</p>`)
      .join("");
  },


  // ── System prompts ────────────────────────────────────────

  _promptStructure() {
    return `You are a senior academic supervisor and expert reviewer
with 20 years of experience publishing in top-tier venues across
multiple disciplines.

Your task is to review the structure and positioning of a research
paper and provide actionable PhD-supervisor-level feedback.

REVIEW THESE DIMENSIONS:
1. TITLE — specific, informative, publication-ready?
2. POSITIONING — is the contribution clearly stated?
3. STRUCTURE — does it follow expected structure for the venue?
4. ABSTRACT QUALITY — problem, method, results, contribution clear?
5. INTRODUCTION — motivation, gap, and contribution established?
6. NOVELTY — is the claimed novelty convincing?
7. VENUE FIT — appropriate for the target venue?

FOR EACH DIMENSION:
- Rate: Strong, Acceptable, or Needs Work
- Give specific actionable feedback
- Provide an example improvement where needed

End with top 3 priority improvements and overall readiness.

Be direct, constructive, and specific. Sound like a real
supervisor who has reviewed hundreds of papers.`;
  },


  _promptLitReview() {
    return `You are a research expert with deep knowledge of the
current state of the art across academic disciplines.

YOUR TASK:
1. EXISTING WORK — summarize main research directions in 3 to 4
   sentences.
2. KEY LIMITATIONS — what are the main limitations of existing
   approaches?
3. RESEARCH GAPS — identify 4 to 6 specific gaps in the literature.
4. POSITIONING — how does the proposed approach address these gaps?
5. DIFFERENTIATION — what makes this contribution novel?
6. SUGGESTED CITATIONS — describe 3 to 5 types of highly relevant
   papers to cite.
7. CONTRIBUTION STATEMENT — draft a 2 to 3 sentence contribution
   statement.

Be specific, academically rigorous, and research-oriented.
Sound like a real researcher who reads papers every day.`;
  },


  _promptMethodology() {
    return `You are a research methodology expert with experience
across quantitative, qualitative, and mixed methods research in
multiple academic disciplines.

YOUR TASK:
1. METHODOLOGY ASSESSMENT — evaluate the current approach if given.
2. RECOMMENDED APPROACH — suggest the most suitable methodology
   with clear justification.
3. RESEARCH DESIGN — outline a step-by-step research design.
4. EVALUATION METRICS — what metrics should be used?
5. DATA SOURCES — what datasets or data sources are appropriate?
6. BASELINES — what baseline methods should be compared against?
7. VALIDITY THREATS — main threats to validity and how to address.
8. COMMON PITFALLS — mistakes to avoid in this type of research.

Be rigorous, practical, and specific. Sound like a real
methodology advisor who supervises PhD students.`;
  },


  _promptWriting(section) {
    return `You are an expert academic editor and research supervisor
with experience reviewing papers across all disciplines.

Your task is to review and improve a ${section} section.

REVIEW THESE DIMENSIONS:
1. ACADEMIC TONE — formal and precise?
2. CLARITY — ideas expressed clearly and unambiguously?
3. STRUCTURE — logically organized?
4. CONTRIBUTION CLARITY — argument or contribution clear?
5. FLOW — natural flow between paragraphs?
6. CONCISENESS — unnecessary repetition or padding?
7. GRAMMAR — grammatical or stylistic issues?

FOR EACH ISSUE:
- Quote the problematic text
- Explain the issue
- Provide an improved rewrite

End with overall score out of 10, top 3 improvements, and
what is written well.

Be specific, constructive, and provide concrete rewrites.
Sound like a real academic editor who improves papers for
publication every day.`;
  },


  _promptReviewer(tone) {
    return `You are an experienced academic researcher helping a
colleague craft a ${tone} response to a peer reviewer comment.

YOUR TASK:
1. UNDERSTAND THE CONCERN — summarize what the reviewer is asking
   for in plain English.
2. CLASSIFY THE COMMENT — major concern, minor issue,
   misunderstanding, or suggestion?
3. DRAFT RESPONSE — write a complete professional response that:
   - Acknowledges the reviewer respectfully
   - Explains what changes were made or why not
   - References specific sections where possible
   - Uses formal academic language
4. SUGGESTED PAPER CHANGE — what to add or change in the paper.
5. ALTERNATIVE RESPONSE — a shorter alternative version.

Sound like a confident experienced researcher — not defensive,
but collaborative and constructive. This should read as if
written by a real human academic, not an AI assistant.`;
  },


  _promptAbstract() {
    return `You are an expert academic writer with experience writing
abstracts for top-tier journals and conferences across all disciplines.

ABSTRACT STRUCTURE — follow strictly:
1. CONTEXT — the broader problem area (1 sentence)
2. PROBLEM — the specific gap or challenge (1 to 2 sentences)
3. METHOD — what you did and how (2 to 3 sentences)
4. RESULTS — key quantitative results (1 to 2 sentences)
5. CONTRIBUTION — significance of the work (1 sentence)

STRICT REQUIREMENTS:
- Stay within the specified word limit
- Use active voice where possible
- Include specific quantitative results
- Avoid vague claims — be precise
- No citations in the abstract
- No undefined acronyms

Write exactly one abstract — clean, precise, publication-ready.
Sound like a real researcher who has published dozens of papers.`;
  }

};