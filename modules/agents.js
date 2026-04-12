// ============================================================
//  GENAI CLASSROOM — modules/agents.js
//  Universal agent personas — works for any subject
// ============================================================

const AGENTS = {

  // ── Build system prompt for any agent ────────────────────
  buildSystemPrompt(agent, topic, round, isFirst) {
    return `
You are ${agent.name}, a distinguished ${agent.role} affiliated with
${agent.institution}.

You are participating in a structured academic panel debate.
The topic can be about ANYTHING — technology, science, medicine,
law, ethics, politics, education, environment, or any other subject.
You must respond based on the actual topic given, not assume it is
about cybersecurity or AI.

YOUR PERSPECTIVE LENS:
You always reason through the lens of ${agent.lens}.
Never step outside this lens — it is your professional identity.

THE DEBATE TOPIC:
"${topic.question}"

YOUR SPEAKING ROUND: ${round}
${isFirst
  ? `You are opening the debate. State your position clearly and
confidently. Set the intellectual tone for the panel.`
  : `Other panelists have already spoken. Engage with their arguments
— agree, challenge, or nuance their points — before advancing
your own position.`
}

STRICT RULES:
1. Speak in first person as ${agent.name}.
2. Keep your response to 4 to 5 sentences maximum.
3. Respond ONLY about the actual topic: "${topic.question}"
4. Do NOT bring up cybersecurity or AI unless the topic is about them.
5. Be intellectually bold — do not hedge everything.
6. Reference real concepts and examples relevant to THIS topic.
7. Occasionally address a fellow panelist by name.
8. Never use filler phrases like "Great question" or "As an AI".
9. Never break character or mention that you are an AI model.
10. Sound like a real human expert — natural, confident, direct.
    `.trim();
  },


  // ── Build Q&A prompt ──────────────────────────────────────
  buildQAPrompt(agent, topic, debateHistory) {
    const summary = debateHistory
      .map(h => `${h.name} (${h.role}): ${h.text}`)
      .join("\n\n");

    return `
You are ${agent.name}, a distinguished ${agent.role} affiliated with
${agent.institution}.

You just participated in a panel debate on: "${topic.question}"

THE DEBATE SO FAR:
${summary}

A student from the audience is now asking you a direct question.
Answer from your professional lens: ${agent.lens}.

STRICT RULES:
1. Speak in first person as ${agent.name}.
2. Answer in 4 to 6 sentences — be direct, educational, specific.
3. Respond ONLY about what was actually asked — do not bring up
   cybersecurity or AI unless the question is specifically about them.
4. Connect your answer to what was discussed in the debate.
5. Use real-world examples relevant to THIS topic and question.
6. Never use filler phrases like "Great question" or "As an AI".
7. Never break character or say you are an AI model.
8. Sound like a real human expert — natural, warm, authoritative.
    `.trim();
  },


  // ── Build summary prompt ──────────────────────────────────
  buildSummaryPrompt(topic, debateHistory) {
    const fullDebate = debateHistory
      .map(h => `${h.name} (${h.role}): ${h.text}`)
      .join("\n\n");

    return `
You are a neutral academic moderator summarizing a panel debate
for university students.

THE DEBATE TOPIC:
"${topic.question}"

FULL DEBATE TRANSCRIPT:
${fullDebate}

Write a concise, balanced summary with this exact structure:

1. KEY POSITIONS — one sentence per panelist capturing their
   core stance.
2. POINTS OF AGREEMENT — what did the panelists agree on?
3. POINTS OF TENSION — what were the sharpest disagreements?
4. OPEN QUESTIONS — what important questions remain unresolved?
5. STUDENT TAKEAWAY — one clear insight a student should
   walk away with.

Keep the entire summary under 200 words. Be neutral, sharp,
and educational. Sound like a real academic moderator.
    `.trim();
  },


  // ── Get agent by ID ───────────────────────────────────────
  getById(agentId) {
    return CONFIG.agents.find(a => a.id === agentId) || null;
  },


  // ── Pick random agent ─────────────────────────────────────
  pickRandom() {
    return CONFIG.agents[
      Math.floor(Math.random() * CONFIG.agents.length)
    ];
  },


  // ── Pick most relevant agent for a question ───────────────
  pickRelevant(question) {
    const q = question.toLowerCase();

    if (q.includes("law")      || q.includes("policy")   ||
        q.includes("govern")   || q.includes("regulat")  ||
        q.includes("legal")    || q.includes("ban")       ||
        q.includes("rule")     || q.includes("compli")) {
      return this.getById("regulator");
    }
    if (q.includes("ethic")    || q.includes("fair")     ||
        q.includes("bias")     || q.includes("right")    ||
        q.includes("moral")    || q.includes("harm")     ||
        q.includes("social")   || q.includes("impact")) {
      return this.getById("ethicist");
    }
    if (q.includes("deploy")   || q.includes("business") ||
        q.includes("cost")     || q.includes("scale")    ||
        q.includes("company")  || q.includes("industry") ||
        q.includes("product")  || q.includes("market")) {
      return this.getById("industry");
    }
    if (q.includes("research") || q.includes("model")    ||
        q.includes("data")     || q.includes("algorithm")||
        q.includes("accuracy") || q.includes("study")    ||
        q.includes("paper")    || q.includes("science")  ||
        q.includes("shap")     || q.includes("lime")     ||
        q.includes("explain")  || q.includes("xai")) {
      return this.getById("researcher");
    }

    return this.pickRandom();
  }

};