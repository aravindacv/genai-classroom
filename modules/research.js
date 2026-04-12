// ============================================================
//  GENAI CLASSROOM — modules/research.js
//  Research Supervisor + Full Implementation Pipeline
// ============================================================

const RESEARCH = {

  selectedTool: "structure",
  currentStep:  1,
  isRunning:    false,

  // ── Session memory for implementation pipeline ────────────
  memory: {
    problem:      "",
    domain:       "",
    question:     "",
    language:     "python",
    venue:        "ieee",
    literature:   "",
    code:         "",
    results:      "",
    observations: ""
  },


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
      implement:   "I want to implement my research idea and write a paper",
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
      "form-implement", "form-structure", "form-litreview",
      "form-methodology", "form-writing", "form-reviewer", "form-abstract"
    ];
    forms.forEach(f => {
      document.getElementById(f).classList.add("hidden");
    });
    document.getElementById(`form-${toolId}`).classList.remove("hidden");
  },


  // ── Update button label ───────────────────────────────────
  _updateBtn(toolId) {
    const labels = {
      implement:   "Run Step ↗",
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


  // ── Navigate sub-steps ────────────────────────────────────
  goStep(stepNum) {
    if (this.selectedTool !== "implement") return;

    // hide all step content
    for (let i = 1; i <= 5; i++) {
      document.getElementById(`step-${i}`).classList.add("hidden");
      const nav = document.getElementById(`nav-s${i}`);
      nav.classList.remove("active", "done");
    }

    // show selected step
    document.getElementById(`step-${stepNum}`).classList.remove("hidden");
    document.getElementById(`nav-s${stepNum}`).classList.add("active");

    // mark previous steps as done
    for (let i = 1; i < stepNum; i++) {
      document.getElementById(`nav-s${i}`).classList.add("done");
    }

    this.currentStep = stepNum;

    // update button label per step
    const stepLabels = {
      1: "Refine Problem + Search Literature ↗",
      2: "Search Literature ↗",
      3: this.memory.code
           ? "Fix Error in My Code ↗"
           : "Generate Implementation ↗",
      4: "Analyse My Results ↗",
      5: "Generate Paper ↗"
    };
    document.getElementById("researchBtn").textContent =
      stepLabels[stepNum] || "Run Step ↗";
  },


  // ── Master run ────────────────────────────────────────────
  async run() {
    if (this.isRunning) return;

    if (this.selectedTool === "implement") {
      await this._runImplementStep();
      return;
    }

    const btn       = document.getElementById("researchBtn");
    this.isRunning  = true;
    btn.disabled    = true;
    btn.textContent = "Analysing...";

    this._clearOutput();
    this._showTyping("Supervisor is reviewing your work...");

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
          this.isRunning = false;
          btn.disabled   = false;
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
          this.isRunning = false;
          btn.disabled   = false;
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
    this._renderResponse(response, "Supervisor Feedback");

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      `Feedback — ${this.selectedTool}`;

    this.isRunning  = false;
    btn.disabled    = false;
    this._updateBtn(this.selectedTool);
  },


  // ── Run implementation pipeline step ──────────────────────
  async _runImplementStep() {
    const btn       = document.getElementById("researchBtn");
    this.isRunning  = true;
    btn.disabled    = true;
    btn.textContent = "Working...";

    this._clearOutput();

    switch (this.currentStep) {
      case 1: await this._stepDefineProblem(); break;
      case 2: await this._stepLiterature();    break;
      case 3: await this._stepCode();          break;
      case 4: await this._stepResults();       break;
      case 5: await this._stepPaper();         break;
    }

    this.isRunning = false;
    btn.disabled   = false;
    this.goStep(this.currentStep);
  },


  // ── Step 1: Define problem + refine question ──────────────
  async _stepDefineProblem() {
    const problem = document.getElementById("impl-problem").value.trim();
    const domain  = document.getElementById("impl-domain").value.trim();
    const lang    = document.getElementById("impl-lang").value;
    const venue   = document.getElementById("impl-venue").value;

    if (!problem) {
      this._addBlock("Please describe your research problem first.");
      return;
    }

    // save to memory
    this.memory.problem  = problem;
    this.memory.domain   = domain || "Computer Science";
    this.memory.language = lang;
    this.memory.venue    = venue;

    this._showTyping("Refining your research problem...");

    const systemPrompt = `You are a senior research supervisor helping
a researcher define and sharpen their research problem.

Your task is to:
1. REFINED RESEARCH QUESTION — Convert the rough problem into a
   precise, publishable research question (1-2 sentences)
2. PROBLEM SIGNIFICANCE — Why does this problem matter? (2-3 sentences)
3. PROPOSED APPROACH — Suggest the best technical approach (3-4 sentences)
4. EXPECTED CONTRIBUTIONS — What will this research contribute? (3-4 bullet points)
5. EVALUATION STRATEGY — How should results be evaluated? (2-3 sentences)

Be specific, rigorous, and academically sound.
Work for any research domain — not just cybersecurity.`;

    const userMessage = `Define and refine this research problem:
Domain: ${this.memory.domain}
Problem: ${problem}
Programming language: ${lang}
Target venue: ${venue}`;

    const response = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    this._removeTyping();
    this._renderResponse(response, "Step 1 — Refined Research Problem");

    // extract and save the refined question to memory
    this.memory.question = response.split("\n")[0]
      .replace(/^[#*\d.\s]+/, "").trim();

    // auto fill step 2 question field
    document.getElementById("impl-question").value =
      this.memory.question || problem;

    // add next step button
    this._addNextStepBtn(2, "Search Literature →");

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      "Step 1 — Research Problem";
  },


  // ── Step 2: Literature search ─────────────────────────────
  async _stepLiterature() {
    const question    = document.getElementById("impl-question").value.trim()
      || this.memory.question || this.memory.problem;
    const knownPapers = document.getElementById("impl-known-papers")
      .value.trim();

    if (!question) {
      this._addBlock("Please complete Step 1 first.");
      return;
    }

    this.memory.question = question;
    this._showTyping("Searching literature and identifying gaps...");

    const systemPrompt = `You are an expert research librarian and
academic supervisor with deep knowledge across all research domains.

Your task is to perform a comprehensive literature analysis for the
given research question. Act like Vertex AI Search — find relevant
work, identify gaps, and position the new research.

Structure your response EXACTLY as follows:

## 1. Research Landscape
Summarize the current state of research in this area (4-5 sentences).

## 2. Key Paper Categories to Review
List 8-10 specific types of papers the researcher should find.
For each paper category provide:
- Type/title description
- Why it is relevant
- Where to find it (IEEE Xplore / ACM DL / arXiv / Google Scholar)
- Suggested search terms

## 3. Seminal Works
List 5-6 foundational papers in this area with:
- Author(s) and approximate year
- What they contributed
- Why they matter for this research

## 4. Recent Advances (2020-2024)
List 4-5 recent research directions with brief descriptions.

## 5. Research Gaps
Identify 4-6 specific gaps that the proposed research addresses.

## 6. Positioning Statement
Write a 3-4 sentence positioning statement for the paper.

## 7. Search Terms
Provide exact search strings for:
- IEEE Xplore
- ACM Digital Library
- Google Scholar
- arXiv

## 8. Suggested References Format
Provide 5 sample references in IEEE format that the researcher
should look for and cite.

Be specific, comprehensive, and academically rigorous.
Work for ANY research domain.`;

    const userMessage = `Perform literature search for:
Research question: ${question}
Domain: ${this.memory.domain}
${knownPapers ? `Papers I already know:\n${knownPapers}` : ""}`;

    const response = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    this._removeTyping();
    this.memory.literature = response;
    this._renderResponse(response, "Step 2 — Literature Search");
    this._addNextStepBtn(3, "Generate Implementation →");

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      "Step 2 — Literature Search";
  },


  // ── Step 3: Generate code or fix error ────────────────────
  async _stepCode() {
    const requirements = document.getElementById("impl-requirements")
      .value.trim();
    const error        = document.getElementById("impl-error").value.trim();

    // if error is pasted — fix mode
    if (error) {
      this._showTyping("Fixing your error...");

      const systemPrompt = `You are an expert ${this.memory.language}
debugger and research engineer.

A researcher has an error in their implementation. Fix it with:
1. WHAT WENT WRONG — plain English explanation
2. ROOT CAUSE — why this error occurred
3. FIXED CODE — complete corrected code block
4. WHAT CHANGED — exact changes made and why
5. PREVENTION TIP — how to avoid this in future

Be clear, educational, and specific.`;

      const userMessage = `Fix this ${this.memory.language} error:

Research context: ${this.memory.question || this.memory.problem}

Error:
${error}

${this.memory.code
  ? `Current code:\n${this.memory.code}`
  : ""}`;

      const response = await API.call(
        systemPrompt,
        [{ role: "user", content: userMessage }]
      );

      this._removeTyping();

      // update code memory with fixed version
      const codeMatch = response.match(/```[\s\S]*?```/g);
      if (codeMatch) {
        this.memory.code = codeMatch[codeMatch.length - 1]
          .replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
      }

      this._renderResponse(response, "Step 3 — Error Fixed");
      this._addNextStepBtn(4, "Analyse Results →");

    } else {
      // generate fresh implementation
      this._showTyping("Generating your implementation...");

      const systemPrompt = `You are a senior ${this.memory.language}
research engineer with 15 years of experience implementing academic
research projects.

Generate a complete, production-quality implementation for the
given research problem. Follow these strict requirements:

1. Use proper project structure with clear file organization
2. Follow language best practices and style guides
3. Include comprehensive docstrings and inline comments
4. Add proper logging and error handling
5. Include requirements/dependencies file
6. Add evaluation metrics relevant to the research
7. Include a main script that runs the complete pipeline
8. Add README with setup and usage instructions
9. Make the code reproducible — set random seeds
10. Include baseline comparison where relevant

Structure the response as:
- Project structure overview
- Each file as a separate labeled code block
- How to run the project
- Expected outputs

Make it research-grade — suitable for publication.`;

      const userMessage = `Implement this research project in
${this.memory.language}:

Research question: ${this.memory.question || this.memory.problem}
Domain: ${this.memory.domain}
${requirements ? `Additional requirements: ${requirements}` : ""}
${this.memory.literature
  ? `Research context from literature:\n${this.memory.literature.substring(0, 500)}...`
  : ""}`;

      const response = await API.call(
        systemPrompt,
        [{ role: "user", content: userMessage }]
      );

      this._removeTyping();

      // save code to memory
      this.memory.code = response;
      this._renderResponse(response, "Step 3 — Implementation");
      this._addNextStepBtn(4, "Analyse Results →");
    }

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      "Step 3 — Implementation";
  },


  // ── Step 4: Results analysis ──────────────────────────────
  async _stepResults() {
    const results      = document.getElementById("impl-results").value.trim();
    const observations = document.getElementById("impl-observations")
      .value.trim();

    if (!results) {
      this._addBlock(
        "Please paste your experiment results first. " +
        "Run your code and paste the output here."
      );
      return;
    }

    this.memory.results      = results;
    this.memory.observations = observations;

    this._showTyping("Analysing your results...");

    const systemPrompt = `You are a senior research supervisor
analysing experimental results for a research paper.

Provide a comprehensive results analysis structured as:

## 1. Results Summary
Summarize the key findings in 3-4 sentences.

## 2. Performance Analysis
Interpret each metric — what does it mean? Is it good?
Compare to typical benchmarks in the field.

## 3. Strengths
What do the results show the proposed approach does well?

## 4. Limitations
What are the limitations or weaknesses shown by the results?

## 5. Comparison to Baselines
How do results compare to related work? Are they competitive?

## 6. Improvement Suggestions
3-5 specific suggestions to improve the results.

## 7. Statistical Significance
What statistical tests should be run to validate these results?

## 8. Visualizations Recommended
What plots/charts should be included in the paper?

## 9. Key Claims for Paper
3-4 strong claims that can be made in the paper based on results.

Be rigorous, specific, and academically sound.`;

    const userMessage = `Analyse these research results:

Research question: ${this.memory.question || this.memory.problem}
Domain: ${this.memory.domain}

Results:
${results}

${observations ? `Researcher observations:\n${observations}` : ""}`;

    const response = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    this._removeTyping();
    this._renderResponse(response, "Step 4 — Results Analysis");
    this._addNextStepBtn(5, "Generate Full Paper →");

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      "Step 4 — Results Analysis";
  },


  // ── Step 5: Generate full paper ───────────────────────────
  async _stepPaper() {
    const title   = document.getElementById("impl-title").value.trim();
    const section = document.getElementById("impl-section").value;
    const authors = document.getElementById("impl-authors").value.trim();

    this._showTyping("Generating your paper...");

    const systemPrompt = `You are an expert academic writer with
20 years of experience publishing in top-tier venues.

Generate a complete, publication-ready research paper section
for the given research. Follow these requirements:

1. Write in formal academic English
2. Follow the structure expected by the target venue (${this.memory.venue})
3. Include proper citations as [Author, Year] placeholders
4. Use precise technical language
5. Make strong, evidence-based claims
6. Follow IEEE/ACM paper formatting conventions
7. Include all standard paper sections

For FULL PAPER generate all these sections:
- Title and Abstract
- Introduction (with contributions listed)
- Related Work (with proper citation placeholders)
- Methodology (detailed technical description)
- Experimental Setup
- Results and Discussion
- Conclusion and Future Work
- References (based on literature search)

Make it publication-ready — not a draft.`;

    const userMessage = `Generate a ${section === "full"
      ? "complete research paper"
      : section + " section"} for:

${title ? `Title: ${title}` : ""}
${authors ? `Authors: ${authors}` : ""}
Research question: ${this.memory.question || this.memory.problem}
Domain: ${this.memory.domain}
Target venue: ${this.memory.venue}

Literature context:
${this.memory.literature
  ? this.memory.literature.substring(0, 800) + "..."
  : "Not available"}

Implementation summary:
${this.memory.code
  ? "Full implementation completed in " + this.memory.language
  : "Not available"}

Experimental results:
${this.memory.results || "Not available"}

Results analysis:
${this.memory.observations || "Not available"}`;

    const response = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    this._removeTyping();
    this._renderResponse(response, "Step 5 — Generated Paper");

    // add reset button for new research
    this._addResetBtn();

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      "Step 5 — Full Paper";
  },


  // ── Add next step button ──────────────────────────────────
  _addNextStepBtn(nextStep, label) {
    const feed = document.getElementById("outputFeed");
    const div  = document.createElement("div");
    div.style.cssText =
      "margin-top:1.25rem;text-align:center;";
    div.innerHTML = `
      <button onclick="RESEARCH.goStep(${nextStep})"
        style="font-size:13px;font-weight:600;padding:0.7rem 1.6rem;
               border-radius:10px;border:none;background:#185FA5;
               color:#fff;cursor:pointer;">
        ${label}
      </button>`;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
  },


  // ── Add reset button ──────────────────────────────────────
  _addResetBtn() {
    const feed = document.getElementById("outputFeed");
    const div  = document.createElement("div");
    div.style.cssText =
      "margin-top:1.25rem;text-align:center;";
    div.innerHTML = `
      <button onclick="RESEARCH.resetPipeline()"
        style="font-size:13px;font-weight:500;padding:0.7rem 1.4rem;
               border-radius:10px;border:1px solid rgba(255,255,255,0.15);
               background:transparent;color:rgba(255,255,255,0.5);
               cursor:pointer;">
        Start new research project ↺
      </button>`;
    feed.appendChild(div);
  },


  // ── Reset pipeline ────────────────────────────────────────
  resetPipeline() {
    this.memory = {
      problem: "", domain: "", question: "",
      language: "python", venue: "ieee",
      literature: "", code: "", results: "", observations: ""
    };
    this.currentStep = 1;
    this.goStep(1);
    this._clearOutput();

    // clear all form fields
    ["impl-problem", "impl-domain", "impl-question",
     "impl-known-papers", "impl-requirements", "impl-error",
     "impl-results", "impl-observations", "impl-title",
     "impl-authors"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  },


  // ── Render response ───────────────────────────────────────
  _renderResponse(text, label) {
    const feed  = document.getElementById("outputFeed");
    feed.innerHTML = "";

    // split on code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    parts.forEach(part => {
      if (part.startsWith("```")) {
        const code = part
          .replace(/^```[a-z]*\n?/, "")
          .replace(/```$/, "")
          .trim();
        const block = document.createElement("div");
        block.className = "output-block";
        block.innerHTML = `
          <div class="output-block-label">Code</div>
          <pre class="output-code">${this._escapeHtml(code)}</pre>`;
        feed.appendChild(block);
      } else if (part.trim()) {
        const block = document.createElement("div");
        block.className = "output-block";
        block.innerHTML = `
          <div class="output-block-label">${label || "Output"}</div>
          <div class="output-text">${this._formatText(part.trim())}</div>`;
        feed.appendChild(block);
      }
    });

    feed.scrollTop = feed.scrollHeight;
  },


  // ── Add simple block ──────────────────────────────────────
  _addBlock(text) {
    const feed  = document.getElementById("outputFeed");
    feed.innerHTML = "";
    const block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML = `
      <div class="output-text"
           style="color:rgba(245,160,122,0.85);">
        ${text}
      </div>`;
    feed.appendChild(block);
  },


  // ── Show typing ───────────────────────────────────────────
  _showTyping(msg) {
    document.getElementById("outputFeed").innerHTML = `
      <div class="output-typing" id="researchTyping">
        <div class="output-typing-dots">
          <span></span><span></span><span></span>
        </div>
        ${msg || "Supervisor is reviewing your work..."}
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


  // ── Escape HTML for code blocks ───────────────────────────
  _escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
university researchers write clear, effective prompts for an AI
research supervisor.

Convert the researcher's rough idea into a well-structured, specific
prompt that will get the best possible academic response.

RULES:
1. Keep the researcher's original intent
2. Make it specific with academic details
3. Keep it concise — max 3 sentences
4. Output ONLY the refined prompt — no preamble
5. Write as a direct instruction to the AI supervisor
6. Work for ANY research discipline`;

    const userMessage = `Convert this rough research idea into a
proper prompt: "${rough}"`;

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

    if (this.selectedTool === "implement") {
      document.getElementById("impl-problem").value = refined;
      document.getElementById("impl-problem").style.borderColor = "#7ab8f5";
      setTimeout(() => {
        document.getElementById("impl-problem").style.borderColor = "";
      }, 1500);
    } else {
      const activeForm = document.getElementById(
        `form-${this.selectedTool}`
      );
      const firstInput = activeForm.querySelector("input, textarea");
      if (firstInput) {
        firstInput.value = refined;
        firstInput.style.borderColor = "#7ab8f5";
        setTimeout(() => { firstInput.style.borderColor = ""; }, 1500);
      }
    }

    document.getElementById("researchBtn")
      .scrollIntoView({ behavior: "smooth" });
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("roughIdea").value = "";
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

    if (this.selectedTool !== "implement") {
      const activeForm = document.getElementById(
        `form-${this.selectedTool}`
      );
      const firstInput = activeForm.querySelector("input, textarea");
      if (firstInput) firstInput.value = "";
    }

    document.getElementById("outputFeed").innerHTML = `
      <div class="output-empty">
        Choose a tool and fill in the details on the left,
        then press the button to begin.
      </div>`;
    document.getElementById("copyBtn").classList.add("hidden");
    document.getElementById("outputTitle").textContent = "Output";
    document.getElementById("roughIdea").focus();
  },


  // ── System prompts ────────────────────────────────────────

  _promptStructure() {
    return `You are a senior academic supervisor reviewing a research
paper. Provide actionable PhD-supervisor-level feedback on:
1. TITLE — specific, informative, publication-ready?
2. POSITIONING — contribution clearly stated?
3. STRUCTURE — follows expected structure for the venue?
4. ABSTRACT QUALITY — problem, method, results clear?
5. INTRODUCTION — motivation, gap, contribution established?
6. NOVELTY — is the claimed novelty convincing?
7. VENUE FIT — appropriate for the target venue?
Rate each: Strong, Acceptable, or Needs Work.
End with top 3 priority improvements.`;
  },

  _promptLitReview() {
    return `You are a research expert performing literature analysis.
1. EXISTING WORK — summarize main research directions.
2. KEY LIMITATIONS — limitations of existing approaches.
3. RESEARCH GAPS — identify 4 to 6 specific gaps.
4. POSITIONING — how does the proposed approach address gaps?
5. DIFFERENTIATION — what makes this contribution novel?
6. SUGGESTED CITATIONS — 3 to 5 types of relevant papers.
7. CONTRIBUTION STATEMENT — draft 2 to 3 sentences.
Be specific and academically rigorous.`;
  },

  _promptMethodology() {
    return `You are a research methodology expert.
1. METHODOLOGY ASSESSMENT — evaluate current approach.
2. RECOMMENDED APPROACH — most suitable methodology.
3. RESEARCH DESIGN — step-by-step design.
4. EVALUATION METRICS — what metrics to use?
5. DATA SOURCES — appropriate datasets or sources.
6. BASELINES — what to compare against?
7. VALIDITY THREATS — threats and how to address.
8. COMMON PITFALLS — mistakes to avoid.
Be rigorous and practical.`;
  },

  _promptWriting(section) {
    return `You are an expert academic editor reviewing a
${section} section. Check:
1. ACADEMIC TONE — formal and precise?
2. CLARITY — ideas expressed clearly?
3. STRUCTURE — logically organized?
4. CONTRIBUTION CLARITY — argument clear?
5. FLOW — natural flow between paragraphs?
6. CONCISENESS — unnecessary repetition?
7. GRAMMAR — grammatical issues?
For each issue: quote problematic text, explain, provide rewrite.
End with score out of 10 and top 3 improvements.`;
  },

  _promptReviewer(tone) {
    return `You are helping craft a ${tone} response to a reviewer.
1. UNDERSTAND — summarize what reviewer is asking.
2. CLASSIFY — major concern, minor issue, or suggestion?
3. DRAFT RESPONSE — complete professional response.
4. SUGGESTED PAPER CHANGE — what to add or change.
5. ALTERNATIVE RESPONSE — shorter version.
Sound confident and collaborative, not defensive.`;
  },

  _promptAbstract() {
    return `Write a publication-ready abstract following this structure:
1. CONTEXT — broader problem area (1 sentence)
2. PROBLEM — specific gap or challenge (1-2 sentences)
3. METHOD — what you did and how (2-3 sentences)
4. RESULTS — key quantitative results (1-2 sentences)
5. CONTRIBUTION — significance of the work (1 sentence)
Stay within word limit. Use active voice. Be precise.`;
  }

};