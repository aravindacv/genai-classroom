// ============================================================
//  GENAI CLASSROOM — modules/lab.js
//  Student Code Lab logic
// ============================================================

const LAB = {

  selectedProject: "fraud",
  selectedMode:    "generate",
  isRunning:       false,


  // ── Init ──────────────────────────────────────────────────
  init() {
    this._updateInputCard();
  },


  // ── Select project ────────────────────────────────────────
  selectProject(projectId, el) {
    this.selectedProject = projectId;
    document.querySelectorAll(".project-item").forEach(p => {
      p.classList.remove("selected");
    });
    el.classList.add("selected");

    const customInput = document.getElementById("customInput");
    if (projectId === "custom") {
      customInput.classList.remove("hidden");
    } else {
      customInput.classList.add("hidden");
    }
  },


  // ── Select mode ───────────────────────────────────────────
  selectMode(modeId, el) {
    this.selectedMode = modeId;
    document.querySelectorAll(".mode-item").forEach(m => {
      m.classList.remove("selected");
    });
    el.classList.add("selected");
    this._updateInputCard();
  },


  // ── Update input card based on mode ───────────────────────
  _updateInputCard() {
    const title    = document.getElementById("inputCardTitle");
    const textarea = document.getElementById("codeInput");
    const btn      = document.getElementById("labBtn");

    switch (this.selectedMode) {
      case "generate":
        title.textContent       = "📋 Additional requirements (optional)";
        textarea.placeholder    = "Any specific requirements? e.g. use scikit-learn, add logging, REST API...";
        btn.textContent         = "Generate Full Project ↗";
        break;
      case "stepbystep":
        title.textContent       = "📋 Additional requirements (optional)";
        textarea.placeholder    = "Any specific requirements or starting point?";
        btn.textContent         = "Start Step by Step ↗";
        break;
      case "fixerror":
        title.textContent       = "🔴 Paste your error message + code";
        textarea.placeholder    = "Paste the full error traceback and the code that caused it...";
        btn.textContent         = "Fix My Error ↗";
        break;
      case "review":
        title.textContent       = "📋 Paste your code for review";
        textarea.placeholder    = "Paste your Python code here for a security and quality review...";
        btn.textContent         = "Review My Code ↗";
        break;
    }
  },


  // ── Get project label ─────────────────────────────────────
  _getProjectLabel() {
    if (this.selectedProject === "custom") {
      return document.getElementById("customProjectName").value.trim()
        || "Custom Cybersecurity Tool";
    }
    const labels = {
      fraud:    "Fraud Detection System",
      ids:      "Intrusion Detection System",
      malware:  "Malware Classifier",
      anomaly:  "Network Anomaly Detector",
      phishing: "Phishing URL Detector"
    };
    return labels[this.selectedProject] || "Cybersecurity Tool";
  },
// ── Refine rough idea into proper prompt ──────────────────
  async refineIdea() {
    const rough   = document.getElementById("roughIdea").value.trim();
    const btn     = document.getElementById("refineBtn");
    const box     = document.getElementById("refinedBox");
    const refined = document.getElementById("refinedText");

    if (!rough) {
      btn.textContent = "Please type your idea first";
      setTimeout(() => { btn.textContent = "Refine my idea ↗"; }, 2000);
      return;
    }

    btn.disabled    = true;
    btn.textContent = "Refining...";
    box.classList.add("hidden");

    const systemPrompt = `You are an expert prompt engineer helping university
students write clear, effective prompts for an AI coding assistant.

Your task is to take a student's rough idea and convert it into a
well-structured, specific prompt that will get the best possible
response from an AI code generator.

RULES:
1. Keep the student's original intent — do not change what they want
2. Make it specific — add technical details they forgot to mention
3. Make it clear — remove ambiguity
4. Keep it concise — max 3 sentences
5. Output ONLY the refined prompt — no explanation, no preamble
6. Write it as if the student is asking the AI directly
7. Do not use bullet points — write as one flowing prompt`;

    const userMessage = `Convert this rough idea into a proper prompt:
"${rough}"

Context: This is for a Python code generation tool that helps
students build any kind of software project — cybersecurity tools,
web apps, data science, automation, games, APIs, or anything else.`;

    const text = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    refined.textContent = text.trim();
    box.classList.remove("hidden");
    btn.disabled    = false;
    btn.textContent = "Refine my idea ↗";
  },


  // ── Use refined prompt ────────────────────────────────────
  useRefined() {
    const refined = document.getElementById("refinedText").textContent;
    if (!refined) return;

    // step 1 — auto select Custom Project
    this.selectedProject = "custom";
    document.querySelectorAll(".project-item").forEach(p => {
      p.classList.remove("selected");
    });
    const customCard = document.querySelector('[data-project="custom"]');
    if (customCard) customCard.classList.add("selected");

    // step 2 — show custom input and fill it with refined prompt
    document.getElementById("customInput").classList.remove("hidden");
    const customName = document.getElementById("customProjectName");
    customName.value = refined;
    customName.style.borderColor = "#6ecfad";
    setTimeout(() => { customName.style.borderColor = ""; }, 1500);

    // step 3 — auto select "Generate full project" mode
    this.selectedMode = "generate";
    document.querySelectorAll(".mode-item").forEach(m => {
      m.classList.remove("selected");
    });
    const generateCard = document.querySelector('[data-mode="generate"]');
    if (generateCard) generateCard.classList.add("selected");

    // step 4 — clear the additional requirements box
    document.getElementById("codeInput").value = "";

    // step 5 — update button label
    this._updateInputCard();

    // step 6 — hide refiner box and clear rough idea
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("roughIdea").value = "";

    // step 7 — scroll to generate button smoothly
    document.getElementById("labBtn").scrollIntoView({ behavior: "smooth" });
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
    document.getElementById("codeInput").value = "";
    document.getElementById("roughIdea").focus();
    document.getElementById("outputFeed").innerHTML = `
      <div class="output-empty">
        Choose a project and mode on the left,
        then press <strong>Generate</strong>.
      </div>`;
    document.getElementById("copyBtn").classList.add("hidden");
    document.getElementById("outputTitle").textContent = "Output";
  },
  // ── Run ───────────────────────────────────────────────────
  async run() {
    if (this.isRunning) return;

    const project     = this._getProjectLabel();
    const extraInput  = document.getElementById("codeInput").value.trim();
    const btn         = document.getElementById("labBtn");

    this.isRunning    = true;
    btn.disabled      = true;
    btn.textContent   = "Working...";

    this._clearOutput();
    this._showTyping();

    let systemPrompt = "";
    let userMessage  = "";

    switch (this.selectedMode) {

      case "generate":
        systemPrompt = this._promptGenerate(project);
        userMessage  = `Build a complete Python ${project}.
${extraInput ? `Additional requirements: ${extraInput}` : ""}
Follow industry standards strictly.`;
        break;

      case "stepbystep":
        systemPrompt = this._promptStepByStep(project);
        userMessage  = `Guide me step by step to build a Python ${project}.
${extraInput ? `Context: ${extraInput}` : ""}
Start from Step 1.`;
        break;

      case "fixerror":
        if (!extraInput) {
          this._removeTyping();
          this._addTextBlock(
            "label-error",
            "Error",
            "Please paste your error message and code in the input box first."
          );
          this.isRunning  = false;
          btn.disabled    = false;
          this._updateInputCard();
          return;
        }
        systemPrompt = this._promptFixError();
        userMessage  = `Fix this Python error:\n\n${extraInput}`;
        break;

      case "review":
        if (!extraInput) {
          this._removeTyping();
          this._addTextBlock(
            "label-error",
            "Error",
            "Please paste your Python code in the input box first."
          );
          this.isRunning  = false;
          btn.disabled    = false;
          this._updateInputCard();
          return;
        }
        systemPrompt = this._promptReview();
        userMessage  = `Review this Python code:\n\n${extraInput}`;
        break;
    }

    const response = await API.call(
      systemPrompt,
      [{ role: "user", content: userMessage }]
    );

    this._removeTyping();
    this._renderResponse(response);

    document.getElementById("copyBtn").classList.remove("hidden");
    document.getElementById("outputTitle").textContent =
      `Output — ${project}`;

    this.isRunning  = false;
    btn.disabled    = false;
    this._updateInputCard();
  },


  // ── Render response into blocks ───────────────────────────
  _renderResponse(text) {
    const feed = document.getElementById("outputFeed");
    feed.innerHTML = "";

    // split on code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    parts.forEach((part, i) => {
      if (part.startsWith("```")) {
        // code block
        const code = part
          .replace(/^```[a-z]*\n?/, "")
          .replace(/```$/, "")
          .trim();
        this._addCodeBlock(code);
      } else if (part.trim()) {
        // text block — detect if it is a step
        const isStep  = /^(step\s*\d+|##?\s*step)/i.test(part.trim());
        const label   = isStep ? "label-step" : "label-explain";
        const heading = isStep ? "Step"       : "Explanation";
        this._addTextBlock(label, heading, part.trim());
      }
    });
  },


  // ── Add text block ────────────────────────────────────────
  _addTextBlock(labelClass, labelText, content) {
    const feed  = document.getElementById("outputFeed");
    const block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML = `
      <div class="output-block-label ${labelClass}">${labelText}</div>
      <div class="output-text">${this._formatText(content)}</div>
    `;
    feed.appendChild(block);
    feed.scrollTop = feed.scrollHeight;
  },


  // ── Add code block ────────────────────────────────────────
  _addCodeBlock(code) {
    const feed  = document.getElementById("outputFeed");
    const block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML = `
      <div class="output-block-label label-code">Python Code</div>
      <pre class="output-code">${this._escapeHtml(code)}</pre>
    `;
    feed.appendChild(block);
    feed.scrollTop = feed.scrollHeight;
  },


  // ── Show typing indicator ─────────────────────────────────
  _showTyping() {
    const feed = document.getElementById("outputFeed");
    feed.innerHTML = `
      <div class="output-typing" id="labTyping">
        <div class="output-typing-dots">
          <span></span><span></span><span></span>
        </div>
        AI is generating your code...
      </div>
    `;
  },


  // ── Remove typing indicator ───────────────────────────────
  _removeTyping() {
    const el = document.getElementById("labTyping");
    if (el) el.remove();
  },


  // ── Clear output ──────────────────────────────────────────
  _clearOutput() {
    document.getElementById("outputFeed").innerHTML = "";
    document.getElementById("copyBtn").classList.add("hidden");
    document.getElementById("outputTitle").textContent = "Output";
  },


  // ── Copy all output ───────────────────────────────────────
  copyOutput() {
    const feed = document.getElementById("outputFeed");
    const text = feed.innerText;
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


  // ── System prompts ────────────────────────────────────────

  _promptGenerate(project) {
    return `You are a senior Python cybersecurity engineer with 15 years of
industry experience. Your task is to generate complete, production-quality
Python code for a ${project}.

STRICT REQUIREMENTS:
1. Use proper Python project structure with multiple files if needed.
2. Follow PEP8 coding standards throughout.
3. Include proper logging using Python's logging module.
4. Add comprehensive docstrings to all classes and functions.
5. Include requirements.txt with all dependencies.
6. Add proper error handling with try/except blocks.
7. Use type hints on all function signatures.
8. Include a README section explaining how to run the project.
9. Add inline comments explaining complex logic.
10. Structure the response as:
    - Project structure overview (text)
    - Each file as a separate code block with filename comment
    - How to run it (text)
    - requirements.txt as a code block

Write clean, readable, industry-standard Python code that a
junior developer could understand and extend.`;
  },


  _promptStepByStep(project) {
    return `You are a patient Python cybersecurity tutor teaching a
university student how to build a ${project} from scratch.

STRICT REQUIREMENTS:
1. Break the project into 6-8 clear steps.
2. For each step:
   - Start with "## Step N: Title"
   - Explain what this step does and WHY in 2-3 sentences
   - Provide the Python code for that step only
   - Explain what the code does line by line
3. Each step must build on the previous one.
4. Use beginner-friendly language — no jargon without explanation.
5. Include tips and common mistakes to avoid.
6. After all steps, provide a "Putting it all together" final code block.
7. End with how to test and run the complete project.

Be encouraging, clear, and educational.`;
  },


  _promptFixError() {
    return `You are an expert Python debugger and cybersecurity engineer.
A student has shared a Python error and needs your help fixing it.

STRICT REQUIREMENTS:
1. First identify exactly what caused the error in plain English.
2. Explain WHY this error occurs — the root cause.
3. Provide the corrected code in a clean code block.
4. Highlight exactly what you changed and why.
5. Add a "Prevention tip" — how to avoid this error in future.
6. If the code has additional issues beyond the error, mention them.
7. Be clear, encouraging, and educational — this is a student.

Structure your response:
- What went wrong (text)
- Root cause explanation (text)
- Fixed code (code block)
- What changed (text)
- Prevention tip (text)`;
  },


  _promptReview() {
    return `You are a senior Python security engineer conducting a
thorough code review for a university cybersecurity student.

STRICT REQUIREMENTS:
Review the code across these dimensions:
1. SECURITY ISSUES — vulnerabilities, injection risks, insecure practices
2. CODE QUALITY — PEP8 compliance, naming, structure, readability
3. ERROR HANDLING — missing try/except, unhandled edge cases
4. PERFORMANCE — inefficiencies, better alternatives
5. BEST PRACTICES — logging, type hints, docstrings, modularity

For each issue found:
- Explain the problem clearly
- Show the problematic code
- Provide the improved version

End with:
- Overall score out of 10
- Top 3 priority fixes
- What was done well (encouragement)

Be constructive, specific, and educational.`;
  }

};