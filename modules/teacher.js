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

  _promptLecture() {
    return `You are an experienced university professor in Cybersecurity and AI
with 20 years of teaching experience. Your task is to create a detailed,
structured lecture series plan.

REQUIREMENTS:
1. For each week provide:
   - Week number and title
   - Learning objectives (3-4 bullet points using Bloom's verbs)
   - Main topics to cover (4-5 key topics)
   - Suggested activities (lab, discussion, case study)
   - Recommended resources (textbook chapters, tools, online resources)
2. Ensure progressive difficulty — build on previous weeks.
3. Include a mix of theory, practical labs, and case studies.
4. Align with industry certifications where relevant (CompTIA, CISSP, CEH).
5. Format clearly with Week headers and structured sections.
6. End with assessment recommendations for the full course.

Be comprehensive, practical, and academically rigorous.`;
  },


  _promptSlides() {
    return `You are an expert instructional designer and university lecturer
creating professional slide deck outlines for cybersecurity courses.

REQUIREMENTS:
1. Structure the slide deck as:
   - Title slide
   - Learning objectives slide
   - Agenda slide
   - Content sections (each with 3-5 slides)
   - Summary slide
   - Discussion/Q&A slide
   - References slide
2. For each slide provide:
   - Slide title
   - 3-5 bullet points of content
   - Suggested visual (diagram, chart, screenshot, etc.)
3. Include at least one hands-on activity or demo slide.
4. Ensure timing is appropriate for the given duration.
5. Add presenter notes suggestions for key slides.

Be detailed, practical, and engaging.`;
  },


  _promptAssessment() {
    return `You are a university assessment designer specializing in
cybersecurity and AI education. Create high-quality assessments that
test both theoretical knowledge and practical application.

FOR MCQ:
- Write clear, unambiguous questions
- Provide 4 options (A-D) with one correct answer
- Include a brief explanation of the correct answer
- Vary difficulty across questions
- Test both knowledge and application

FOR CASE STUDY:
- Provide a realistic cybersecurity scenario
- Include background context
- Ask 3-5 analytical questions
- Include a model answer guide

FOR RUBRIC:
- Create detailed grading criteria
- Include performance levels (Excellent/Good/Satisfactory/Needs Improvement)
- Map to learning outcomes
- Be specific and measurable

FOR MIXED:
- Combine MCQ, short answer, and one case study
- Balance marks appropriately

Be rigorous, fair, and educationally sound.`;
  },


  _promptBlooms() {
    return `You are an educational taxonomy expert specializing in
Bloom's Revised Taxonomy for higher education in cybersecurity and AI.

REQUIREMENTS:
1. Map each learning outcome to one of the 6 Bloom's levels:
   - Remember — recall facts and basic concepts
   - Understand — explain ideas or concepts
   - Apply — use information in new situations
   - Analyze — draw connections among ideas
   - Evaluate — justify a decision or course of action
   - Create — produce new or original work
2. For each outcome:
   - State the current outcome
   - Identify its Bloom's level
   - Explain why it maps there
   - Suggest an improved version using stronger action verbs
3. Provide a distribution summary showing how many outcomes
   fall at each level.
4. Recommend additional outcomes to fill any gaps in the taxonomy.
5. Suggest appropriate assessment methods for each level.

Be precise, educational, and constructive.`;
  },


  _promptDiscussion() {
    return `You are an expert facilitator and university lecturer skilled
at designing discussion questions that promote critical thinking in
cybersecurity and AI education.

FOR SOCRATIC QUESTIONS:
- Questions that probe assumptions
- Questions that challenge perspectives
- Questions that explore implications
- Open-ended, no single correct answer

FOR DEBATE PROMPTS:
- Clear propositions students can argue for/against
- Controversial enough to generate discussion
- Grounded in real cybersecurity dilemmas

FOR REFLECTIVE QUESTIONS:
- Connect theory to personal experience
- Encourage self-assessment
- Promote ethical reasoning

FOR CASE-BASED QUESTIONS:
- Brief scenario followed by analytical questions
- Require application of concepts
- Have multiple valid perspectives

FORMAT:
- Number each question clearly
- Add a brief facilitator note for each question
- Indicate estimated discussion time
- Note follow-up probing questions

Be intellectually stimulating and pedagogically sound.`;
  }

};