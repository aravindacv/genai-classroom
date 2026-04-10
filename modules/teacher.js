// ============================================================
//  GENAI CLASSROOM — modules/teacher.js
//  Teacher Studio logic
// ============================================================

const TEACHER = {

  selectedTool: "lecture",
  isRunning:    false,


  // ── Init ──────────────────────────────────────────────────
  init() {
    this._showForm("lecture");
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
      "form-lecture", "form-slides",
      "form-assessment", "form-blooms", "form-discussion"
    ];
    forms.forEach(f => {
      document.getElementById(f).classList.add("hidden");
    });
    document.getElementById(`form-${toolId}`).classList.remove("hidden");
  },


  // ── Update button label ───────────────────────────────────
  _updateBtn(toolId) {
    const labels = {
      lecture:    "Generate Lecture Series ↗",
      slides:     "Generate Slide Outline ↗",
      assessment: "Generate Assessment ↗",
      blooms:     "Map to Bloom's Taxonomy ↗",
      discussion: "Generate Questions ↗"
    };
    document.getElementById("studioBtn").textContent =
      labels[toolId] || "Generate ↗";
  },


  // ── Run ───────────────────────────────────────────────────
  async run() {
    if (this.isRunning) return;

    const btn         = document.getElementById("studioBtn");
    this.isRunning    = true;
    btn.disabled      = true;
    btn.textContent   = "Generating...";

    this._clearOutput();
    this._showTyping();

    let systemPrompt = "";
    let userMessage  = "";

    switch (this.selectedTool) {

      case "lecture": {
        const subject = document.getElementById("lec-subject").value.trim()
          || "Cybersecurity Fundamentals";
        const weeks   = document.getElementById("lec-weeks").value;
        const level   = document.getElementById("lec-level").value;
        const goals   = document.getElementById("lec-goals").value.trim();
        systemPrompt  = this._promptLecture();
        userMessage   = `Create a ${weeks}-week lecture series for:
Subject: ${subject}
Level: ${level}
${goals ? `Learning goals: ${goals}` : ""}`;
        break;
      }

      case "slides": {
        const topic    = document.getElementById("slide-topic").value.trim()
          || "Cybersecurity Topic";
        const duration = document.getElementById("slide-duration").value;
        const level    = document.getElementById("slide-level").value;
        const points   = document.getElementById("slide-points").value.trim();
        systemPrompt   = this._promptSlides();
        userMessage    = `Create a slide outline for:
Topic: ${topic}
Duration: ${duration} minutes
Level: ${level}
${points ? `Key points: ${points}` : ""}`;
        break;
      }

      case "assessment": {
        const topic      = document.getElementById("assess-topic").value.trim()
          || "Cybersecurity";
        const type       = document.getElementById("assess-type").value;
        const difficulty = document.getElementById("assess-difficulty").value;
        const count      = document.getElementById("assess-count").value;
        systemPrompt     = this._promptAssessment();
        userMessage      = `Create a ${type} assessment:
Topic: ${topic}
Difficulty: ${difficulty}
Number of questions: ${count}`;
        break;
      }

      case "blooms": {
        const topic    = document.getElementById("blooms-topic").value.trim()
          || "Cybersecurity";
        const outcomes = document.getElementById("blooms-outcomes").value.trim();
        systemPrompt   = this._promptBlooms();
        userMessage    = `Map these learning outcomes to Bloom's taxonomy:
Topic: ${topic}
${outcomes ? `Current outcomes:\n${outcomes}` : "Generate appropriate outcomes for this topic."}`;
        break;
      }

      case "discussion": {
        const topic  = document.getElementById("disc-topic").value.trim()
          || "Cybersecurity Ethics";
        const style  = document.getElementById("disc-style").value;
        const count  = document.getElementById("disc-count").value;
        systemPrompt = this._promptDiscussion();
        userMessage  = `Generate ${count} ${style} discussion questions for:
Topic: ${topic}`;
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
      `Output — ${this.selectedTool}`;

    this.isRunning  = false;
    btn.disabled    = false;
    this._updateBtn(this.selectedTool);
  },


  // ── Render response ───────────────────────────────────────
  _renderResponse(text) {
    const feed = document.getElementById("outputFeed");
    feed.innerHTML = "";
    const block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML = `
      <div class="output-block-label">Result</div>
      <div class="output-text">${this._formatText(text)}</div>
    `;
    feed.appendChild(block);
  },


  // ── Show typing ───────────────────────────────────────────
  _showTyping() {
    document.getElementById("outputFeed").innerHTML = `
      <div class="output-typing" id="studioTyping">
        <div class="output-typing-dots">
          <span></span><span></span><span></span>
        </div>
        AI is preparing your content...
      </div>`;
  },


  // ── Remove typing ─────────────────────────────────────────
  _removeTyping() {
    const el = document.getElementById("studioTyping");
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

 _promptGenerate(project) {
    return `You are a senior software engineer and domain expert with
15 years of industry experience. Your task is to generate complete,
production-quality Python code for: ${project}.

STRICT REQUIREMENTS:
1. Use proper Python project structure.
2. Follow PEP8 coding standards throughout.
3. Include proper logging using Python logging module.
4. Add comprehensive docstrings to all classes and functions.
5. Include requirements.txt with all dependencies.
6. Add proper error handling with try/except blocks.
7. Use type hints on all function signatures.
8. Include a README section explaining how to run the project.
9. Add inline comments explaining complex logic.
10. Structure the response as:
    - Project structure overview
    - Each file as a separate code block
    - How to run it
    - requirements.txt

Write clean, readable, industry-standard Python that a junior
developer could understand and extend.`;
  },


  _promptStepByStep(project) {
    return `You are a patient Python tutor teaching a university
student how to build: ${project} from scratch.

STRICT REQUIREMENTS:
1. Break the project into 6 to 8 clear steps.
2. For each step:
   - Start with "## Step N: Title"
   - Explain what this step does and WHY in 2 to 3 sentences
   - Provide the Python code for that step only
   - Explain what the code does line by line
3. Each step must build on the previous one.
4. Use beginner-friendly language — no jargon without explanation.
5. Include tips and common mistakes to avoid.
6. After all steps provide a complete final code block.
7. End with how to test and run the project.

Be encouraging, clear, and educational. Sound like a real
human tutor who genuinely wants the student to succeed.`;
  },


  _promptFixError() {
    return `You are an expert Python debugger. A student has shared
a Python error and needs your help fixing it.

STRICT REQUIREMENTS:
1. Identify exactly what caused the error in plain English.
2. Explain WHY this error occurs — the root cause.
3. Provide the corrected code in a clean code block.
4. Highlight exactly what you changed and why.
5. Add a prevention tip — how to avoid this in future.
6. If the code has other issues beyond the error mention them.
7. Be clear, encouraging, and educational.

Structure your response:
- What went wrong
- Root cause explanation
- Fixed code block
- What changed
- Prevention tip

Sound like a real senior developer helping a junior colleague.`;
  },


  _promptReview() {
    return `You are a senior Python engineer conducting a thorough
code review for a university student.

Review the code across these dimensions:
1. CODE QUALITY — structure, naming, readability, PEP8
2. ERROR HANDLING — missing try/except, unhandled edge cases
3. SECURITY ISSUES — vulnerabilities, insecure practices
4. PERFORMANCE — inefficiencies, better alternatives
5. BEST PRACTICES — logging, type hints, docstrings, modularity

For each issue found:
- Explain the problem clearly
- Show the problematic code
- Provide the improved version

End with:
- Overall score out of 10
- Top 3 priority fixes
- What was done well

Be constructive, specific, and educational. Sound like a real
senior developer who wants to help the student improve.`;
  }

};