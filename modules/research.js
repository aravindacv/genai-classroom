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

    const labels = {
      structure:   "I want feedback on the structure of my research paper",
      litreview:   "I want to find gaps in the literature for my research topic",
      methodology: "I need advice on the research methodology for my study",
      writing:     "I want my writing reviewed for academic quality and clarity",
      reviewer:    "I need help responding to a reviewer comment on my paper",
      abstract:    "I want to write or improve the abstract for my paper"
    };

    const roughIdea = document.getElementById("roughIdea");
    roughIdea.value = labels[toolId] || "";
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("refinedText").textContent = "";
    roughIdea.style.borderColor = "#7ab8f5";
    setTimeout(() => { roughIdea.style.borderColor = ""; }, 1500);
    roughIdea.scrollIntoView({ behavior: "smooth", block: "center" });
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
          || "Research";
        const venue   = document.getElementById("str-venue").value;
        const content = document.getElementById("str-content").value.trim();
        systemPrompt  = this._promptStructure();
        userMessage   = `Review this research paper:
Title: ${title}
Area: ${area}
Target venue: ${venue}
${content
  ? `Abstract/Introduction:\n${content}`
  : "No content provided — give general guidance for this venue."}`;
        break;
      }

      case "litreview": {
        const topic    = document.getElementById("lit-topic").value.trim()
          || "Research topic";
        const approach = document.getElementById("lit-approach").value.trim();
        const papers   = document.getElementById("lit-papers").value.trim();
        systemPrompt   = this._promptLitReview();
        userMessage    = `Find literature gaps for:
Topic: ${topic}
${approach ? `My proposed approach: ${approach}` : ""}
${papers   ? `Papers I know: ${papers}`           : ""}`;
        break;
      }

      case "methodology": {
        const problem = document.getElementById("meth-problem").value.trim()
          || "Research problem";
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


  // ── Refine rough idea into proper prompt ──────────────────
  async refineIdea() {
    const rough = document.getElementById("roughIdea").value.trim();
    const btn   = document.getElementById("refineBtn");
    const box   = document.getElementById("refinedBox");

    if (!rough) {
      btn.textContent = "Please type your idea first";
      setTimeout(() => { btn.textContent = "Refine my idea ↗"; }, 2000);
      return;
    }

    btn.disabled    = true;
    btn.textContent = "Refining...";
    box.classList.add("hidden");

    const systemPrompt = `You are an expert prompt engineer helping
university researchers and PhD students write clear, effective prompts
for an AI research supervisor.

Your task is to take a researcher's rough idea and convert it into a
well-structured, specific prompt that will get the best possible
academic feedback from the AI.

RULES:
1. Keep the researcher's original intent — do not change what they want
2. Make it specific — add academic details they forgot to mention
3. Make it clear — remove ambiguity
4. Keep it concise — max 3 sentences
5. Output ONLY the refined prompt — no explanation, no preamble
6. Write it as a direct instruction to the AI supervisor
7. Do not use bullet points — write as one flowing prompt
8. Work for ANY research discipline — not just cybersecurity`;

    const userMessage = `Convert this rough research idea into a
proper prompt: "${rough}"

Context: This is for an AI research supervisor that helps with
paper structure, literature review, methodology, writing quality,
reviewer responses, and abstract writing across any academic field.`;

    const text = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    document.getElementById("refinedText").textContent = text.trim();
    box.classList.remove("hidden");
    btn.disabled    = false;
    btn.textContent = "Refine my idea ↗";
  },


  // ── Use refined prompt ────────────────────────────────────
  useRefined() {
    const refined = document.getElementById("refinedText").textContent;
    if (!refined) return;

    const activeForm = document.getElementById(`form-${this.selectedTool}`);
    const firstInput = activeForm.querySelector("input, textarea");
    if (firstInput) {
      firstInput.value = refined;
      firstInput.style.borderColor = "#7ab8f5";
      setTimeout(() => { firstInput.style.borderColor = ""; }, 1500);
    }

    document.getElementById("researchBtn").scrollIntoView({ behavior: "smooth" });
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("roughIdea").value = "";

    const btn = document.getElementById("researchBtn");
    btn.style.background = "#0C447C";
    setTimeout(() => { btn.style.background = ""; }, 1500);
  },


  // ── Discard refined prompt ────────────────────────────────
  discardRefined() {
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("roughIdea").value = "";
  },


  // ── Clear everything for a fresh question ─────────────────
  clearRefiner() {
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("roughIdea").value = "";

    const activeForm = document.getElementById(`form-${this.selectedTool}`);
    const firstInput = activeForm.querySelector("input, textarea");
    if (firstInput) firstInput.value = "";

    document.getElementById("outputFeed").innerHTML = `
      <div class="output-empty">
        Choose a tool and fill in the details on the left,
        then press <strong>Get Feedback</strong>.
      </div>`;
    document.getElementById("copyBtn").classList.add("hidden");
    document.getElementById("outputTitle").textContent = "Output";
    document.getElementById("roughIdea").focus();
  },


  // ── System prompts ────────────────────────────────────────

  _promptStructure() {
    return `You are a senior academic supervisor and expert reviewer
with 20 years of experience publishing in top-tier venues across
multiple disciplines.

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
Be direct, constructive, and specific.`;
  },


  _promptLitReview() {
    return `You are a research expert with deep knowledge of the
current state of the art across academic disciplines.

YOUR TASK:
1. EXISTING WORK — summarize main research directions in 3 to 4 sentences.
2. KEY LIMITATIONS — main limitations of existing approaches.
3. RESEARCH GAPS — identify 4 to 6 specific gaps in the literature.
4. POSITIONING — how does the proposed approach address these gaps?
5. DIFFERENTIATION — what makes this contribution novel?
6. SUGGESTED CITATIONS — describe 3 to 5 types of relevant papers.
7. CONTRIBUTION STATEMENT — draft a 2 to 3 sentence statement.

Be specific, academically rigorous, and research-oriented.`;
  },


  _promptMethodology() {
    return `You are a research methodology expert with experience
across quantitative, qualitative, and mixed methods research.

YOUR TASK:
1. METHODOLOGY ASSESSMENT — evaluate the current approach if given.
2. RECOMMENDED APPROACH — suggest the most suitable methodology.
3. RESEARCH DESIGN — outline a step-by-step research design.
4. EVALUATION METRICS — what metrics should be used?
5. DATA SOURCES — what datasets or sources are appropriate?
6. BASELINES — what baseline methods should be compared against?
7. VALIDITY THREATS — main threats and how to address them.
8. COMMON PITFALLS — mistakes to avoid in this type of research.

Be rigorous, practical, and specific.`;
  },


  _promptWriting(section) {
    return `You are an expert academic editor reviewing a ${section} section.

REVIEW THESE DIMENSIONS:
1. ACADEMIC TONE — formal and precise?
2. CLARITY — ideas expressed clearly?
3. STRUCTURE — logically organized?
4. CONTRIBUTION CLARITY — argument clear?
5. FLOW — natural flow between paragraphs?
6. CONCISENESS — unnecessary repetition?
7. GRAMMAR — grammatical or stylistic issues?

FOR EACH ISSUE:
- Quote the problematic text
- Explain the issue
- Provide an improved rewrite

End with overall score out of 10, top 3 improvements, and
what is written well.`;
  },


  _promptReviewer(tone) {
    return `You are an experienced academic researcher helping craft
a ${tone} response to a peer reviewer comment.

YOUR TASK:
1. UNDERSTAND THE CONCERN — summarize what the reviewer is asking.
2. CLASSIFY THE COMMENT — major concern, minor issue, or suggestion?
3. DRAFT RESPONSE — complete professional response that:
   - Acknowledges the reviewer respectfully
   - Explains what changes were made or why not
   - References specific sections where possible
4. SUGGESTED PAPER CHANGE — what to add or change.
5. ALTERNATIVE RESPONSE — a shorter alternative version.

Sound like a confident experienced researcher — collaborative
and constructive, not defensive.`;
  },


  _promptAbstract() {
    return `You are an expert academic writer writing abstracts for
top-tier journals and conferences across all disciplines.

ABSTRACT STRUCTURE — follow strictly:
1. CONTEXT — the broader problem area (1 sentence)
2. PROBLEM — the specific gap or challenge (1 to 2 sentences)
3. METHOD — what you did and how (2 to 3 sentences)
4. RESULTS — key quantitative results (1 to 2 sentences)
5. CONTRIBUTION — significance of the work (1 sentence)

REQUIREMENTS:
- Stay within the specified word limit
- Use active voice where possible
- Include specific quantitative results
- No citations, no undefined acronyms

Write exactly one abstract — clean, precise, publication-ready.`;
  }

};