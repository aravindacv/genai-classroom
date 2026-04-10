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
    return `You are a senior academic supervisor and expert reviewer with
20 years of experience publishing in top-tier IEEE, ACM, and Springer
venues in Cybersecurity and AI.

Your task is to review the structure and positioning of a research paper
and provide actionable PhD-supervisor-level feedback.

REVIEW THESE DIMENSIONS:
1. TITLE — Is it specific, informative, and publication-ready?
2. POSITIONING — Is the contribution clearly stated?
3. STRUCTURE — Does it follow the expected structure for the venue?
4. ABSTRACT QUALITY — Problem, method, results, contribution clear?
5. INTRODUCTION — Does it establish motivation, gap, and contribution?
6. NOVELTY — Is the claimed novelty convincing?
7. VENUE FIT — Is this appropriate for the target venue?

FOR EACH DIMENSION:
- Rate: Strong / Acceptable / Needs Work
- Give specific, actionable feedback
- Provide an example improvement where needed

End with:
- Top 3 priority improvements before submission
- Overall readiness assessment

Be direct, constructive, and specific — like a real supervisor.`;
  },


  _promptLitReview() {
    return `You are a research expert in Cybersecurity and AI with deep
knowledge of the current state of the art. Your task is to help a
researcher identify literature gaps and position their contribution.

YOUR TASK:
1. EXISTING WORK OVERVIEW — Summarize the main research directions
   in this area in 3-4 sentences.
2. KEY LIMITATIONS — What are the main limitations of existing approaches?
3. RESEARCH GAPS — Identify 4-6 specific gaps in the literature.
4. POSITIONING — How does the proposed approach address these gaps?
5. DIFFERENTIATION — What makes this contribution novel and significant?
6. SUGGESTED CITATIONS — Name 3-5 highly relevant paper types to cite
   (describe the type of paper, not specific papers you may hallucinate).
7. CONTRIBUTION STATEMENT — Draft a 2-3 sentence contribution statement.

Be specific, academically rigorous, and research-oriented.`;
  },


  _promptMethodology() {
    return `You are a research methodology expert specializing in
Cybersecurity and AI research. Your task is to advise a researcher
on the most appropriate methodology for their work.

YOUR TASK:
1. METHODOLOGY ASSESSMENT — Evaluate the current approach if provided.
2. RECOMMENDED APPROACH — Suggest the most suitable methodology with
   clear justification.
3. RESEARCH DESIGN — Outline a step-by-step research design.
4. EVALUATION METRICS — What metrics should be used to evaluate results?
5. DATASETS — What datasets or data sources are appropriate?
6. BASELINES — What baseline methods should be compared against?
7. VALIDITY THREATS — What are the main threats to validity and how
   to address them?
8. COMMON PITFALLS — What mistakes to avoid in this type of research?

Be rigorous, practical, and specific to the research area.`;
  },


  _promptWriting(section) {
    return `You are an expert academic editor and research supervisor
specializing in Cybersecurity and AI publications. Your task is to
review and improve a ${section} section of a research paper.

REVIEW THESE DIMENSIONS:
1. ACADEMIC TONE — Is the writing formal and precise?
2. CLARITY — Are ideas expressed clearly and unambiguously?
3. STRUCTURE — Is the section logically organized?
4. CONTRIBUTION CLARITY — Is the contribution/argument clear?
5. TECHNICAL ACCURACY — Are technical terms used correctly?
6. FLOW — Does the text flow naturally between paragraphs?
7. CONCISENESS — Is there unnecessary repetition or padding?
8. GRAMMAR — Are there grammatical or stylistic issues?

FOR EACH ISSUE:
- Quote the problematic text
- Explain the issue
- Provide an improved version

End with:
- Overall writing quality score out of 10
- Top 3 improvements needed
- What is written well

Be specific, constructive, and provide concrete rewrites.`;
  },


  _promptReviewer(tone) {
    return `You are an expert academic researcher helping a colleague
craft a ${tone} response to a peer reviewer comment.

YOUR TASK:
1. UNDERSTAND THE CONCERN — Summarize what the reviewer is actually
   asking for in plain English.
2. CLASSIFY THE COMMENT — Is this a major concern, minor issue,
   misunderstanding, or suggestion?
3. DRAFT RESPONSE — Write a complete, professional response that:
   - Acknowledges the reviewer's concern respectfully
   - Explains what changes were made (or why not)
   - References specific sections/line numbers if possible
   - Uses formal academic language
4. SUGGESTED PAPER CHANGE — What should be added or changed in the
   paper to address this comment?
5. ALTERNATIVE RESPONSE — Provide a shorter alternative version.

Make the response sound like a confident, experienced researcher.
Do not be defensive — be collaborative and constructive.`;
  },


  _promptAbstract() {
    return `You are an expert academic writer specializing in
Cybersecurity and AI research publications. Your task is to write
a high-quality, publication-ready abstract.

ABSTRACT STRUCTURE (follow strictly):
1. CONTEXT (1 sentence) — The broader problem area
2. PROBLEM (1-2 sentences) — The specific gap or challenge
3. METHOD (2-3 sentences) — What you did and how
4. RESULTS (1-2 sentences) — Key quantitative results
5. CONTRIBUTION (1 sentence) — The significance of the work

STRICT REQUIREMENTS:
- Stay within the specified word limit
- Use active voice where possible
- Include specific quantitative results
- Avoid vague claims — be precise
- No citations in the abstract
- No undefined acronyms
- End with impact/significance

Write exactly one abstract — clean, precise, and publication-ready.`;
  }

};