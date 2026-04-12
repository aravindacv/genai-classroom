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
    this._updateBtn("lecture");
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
      lecture:    "I want to plan a lecture series for my students",
      slides:     "I want to create a slide outline for my lecture",
      assessment: "I want to build an assessment or quiz for my students",
      blooms:     "I want to map my learning outcomes to Bloom's taxonomy",
      discussion: "I want to create discussion questions for my class"
    };

    const roughIdea = document.getElementById("roughIdea");
    roughIdea.value = labels[toolId] || "";
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("refinedText").textContent = "";
    roughIdea.style.borderColor = "#f5a07a";
    setTimeout(() => { roughIdea.style.borderColor = ""; }, 1500);
    roughIdea.scrollIntoView({ behavior: "smooth", block: "center" });
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

    const btn       = document.getElementById("studioBtn");
    this.isRunning  = true;
    btn.disabled    = true;
    btn.textContent = "Generating...";

    this._clearOutput();
    this._showTyping();

    let systemPrompt = "";
    let userMessage  = "";

    switch (this.selectedTool) {

      case "lecture": {
        const subject = document.getElementById("lec-subject").value.trim()
          || "General Subject";
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
          || "General Topic";
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
          || "General Topic";
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
          || "General Topic";
        const outcomes = document.getElementById("blooms-outcomes").value.trim();
        systemPrompt   = this._promptBlooms();
        userMessage    = `Map these learning outcomes to Bloom's taxonomy:
Topic: ${topic}
${outcomes
  ? `Current outcomes:\n${outcomes}`
  : "Generate appropriate outcomes for this topic."}`;
        break;
      }

      case "discussion": {
        const topic  = document.getElementById("disc-topic").value.trim()
          || "General Topic";
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
    const feed  = document.getElementById("outputFeed");
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


  // ── Refine rough idea into proper prompt ──────────────────
  async refineIdea() {
    const rough   = document.getElementById("roughIdea").value.trim();
    const btn     = document.getElementById("refineBtn");
    const box     = document.getElementById("refinedBox");

    if (!rough) {
      btn.textContent = "Please type your idea first";
      setTimeout(() => { btn.textContent = "Refine my idea ↗"; }, 2000);
      return;
    }

    btn.disabled    = true;
    btn.textContent = "Refining...";
    box.classList.add("hidden");

    const systemPrompt = `You are an expert prompt engineer helping
university teachers write clear, effective prompts for an AI
teaching assistant.

Your task is to take a teacher's rough idea and convert it into a
well-structured, specific prompt that will get the best possible
response from the AI.

RULES:
1. Keep the teacher's original intent — do not change what they want
2. Make it specific — add pedagogical details they forgot to mention
3. Make it clear — remove ambiguity
4. Keep it concise — max 3 sentences
5. Output ONLY the refined prompt — no explanation, no preamble
6. Write it as a direct instruction to the AI
7. Do not use bullet points — write as one flowing prompt
8. Work for ANY subject — not just cybersecurity`;

    const userMessage = `Convert this rough teaching idea into a
proper prompt: "${rough}"

Context: This is for an AI teaching assistant that helps create
lecture plans, assessments, slide outlines, and discussion questions
for university courses across any subject.`;

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
      firstInput.style.borderColor = "#f5a07a";
      setTimeout(() => { firstInput.style.borderColor = ""; }, 1500);
    }

    document.getElementById("studioBtn").scrollIntoView({ behavior: "smooth" });
    document.getElementById("refinedBox").classList.add("hidden");
    document.getElementById("roughIdea").value = "";

    const btn = document.getElementById("studioBtn");
    btn.style.background = "#712B13";
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
        then press <strong>Generate</strong>.
      </div>`;
    document.getElementById("copyBtn").classList.add("hidden");
    document.getElementById("outputTitle").textContent = "Output";
    document.getElementById("roughIdea").focus();
  },


  // ── System prompts ────────────────────────────────────────

  _promptLecture() {
    return `You are an experienced university professor with 20 years
of teaching experience across multiple disciplines.

Your task is to create a detailed, structured lecture series plan
for the given subject and level.

REQUIREMENTS:
1. For each week provide:
   - Week number and title
   - Learning objectives using Bloom's taxonomy verbs
   - Main topics to cover
   - Suggested activities — lab, discussion, case study
   - Recommended resources
2. Ensure progressive difficulty — build on previous weeks.
3. Include a mix of theory, practical work, and case studies.
4. End with assessment recommendations for the full course.

Be comprehensive, practical, and academically rigorous.
Sound like a real professor who has taught this subject for years.`;
  },


  _promptSlides() {
    return `You are an expert instructional designer and university
lecturer creating professional slide deck outlines.

REQUIREMENTS:
1. Structure the slide deck as:
   - Title slide
   - Learning objectives slide
   - Agenda slide
   - Content sections with 3 to 5 slides each
   - Summary slide
   - Discussion slide
   - References slide
2. For each slide provide:
   - Slide title
   - 3 to 5 bullet points of content
   - Suggested visual
3. Include at least one hands-on activity slide.
4. Add presenter notes for key slides.

Be detailed, practical, and engaging.`;
  },


  _promptAssessment() {
    return `You are a university assessment designer with expertise
in creating rigorous, fair assessments across all disciplines.

FOR MCQ:
- Write clear unambiguous questions
- Provide 4 options A to D with one correct answer
- Include explanation of the correct answer
- Vary difficulty across questions

FOR CASE STUDY:
- Provide a realistic scenario
- Include background context
- Ask 3 to 5 analytical questions
- Include a model answer guide

FOR RUBRIC:
- Create detailed grading criteria
- Include performance levels
- Map to learning outcomes

FOR MIXED:
- Combine MCQ, short answer, and one case study
- Balance marks appropriately

Be rigorous, fair, and educationally sound.`;
  },


  _promptBlooms() {
    return `You are an educational taxonomy expert specializing in
Bloom's Revised Taxonomy for higher education.

REQUIREMENTS:
1. Map each learning outcome to one of the 6 Bloom's levels:
   - Remember, Understand, Apply, Analyze, Evaluate, Create
2. For each outcome:
   - State the current outcome
   - Identify its Bloom's level
   - Explain why it maps there
   - Suggest an improved version with stronger action verbs
3. Provide a distribution summary across all levels.
4. Recommend additional outcomes to fill any gaps.
5. Suggest appropriate assessment methods per level.

Be precise, educational, and constructive.`;
  },


  _promptDiscussion() {
    return `You are an expert facilitator and university lecturer
skilled at designing discussion questions that promote critical
thinking across all subject areas.

FOR SOCRATIC: Questions that probe assumptions and challenge perspectives.
FOR DEBATE: Clear propositions students can argue for or against.
FOR REFLECTIVE: Connect theory to personal experience.
FOR CASE-BASED: Brief scenario followed by analytical questions.

FORMAT:
- Number each question clearly
- Add a brief facilitator note per question
- Indicate estimated discussion time
- Note follow-up probing questions

Be intellectually stimulating and pedagogically sound.`;
  }

};