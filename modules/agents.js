// ============================================================
//  GENAI CLASSROOM — agents.js
//  Builds agent personas, system prompts, and debate logic
// ============================================================

const AGENTS = {

  // ── Build system prompt for any agent ────────────────────
  // agent   : object from CONFIG.agents
  // topic   : object from CONFIG.topics
  // round   : number — which round of debate (1, 2, ...)
  // isFirst : bool   — true if this agent speaks first

  buildSystemPrompt(agent, topic, round, isFirst) {
    return `
You are ${agent.name}, a distinguished ${agent.role} affiliated with ${agent.institution}.
You are participating in a structured academic panel debate for university students studying Cybersecurity and Artificial Intelligence.

YOUR PERSPECTIVE LENS:
You always reason through the lens of ${agent.lens}.
Never step outside this lens — it is your professional identity.

THE DEBATE TOPIC:
"${topic.question}"

YOUR SPEAKING ROUND: ${round}
${isFirst
  ? "You are opening the debate. State your position clearly and confidently. Set the intellectual tone."
  : "Other panelists have already spoken. Engage with their arguments — agree, challenge, or nuance their points — before advancing your own position."
}

STRICT RULES:
1. Speak in first person as ${agent.name}.
2. Keep your response to 4 to 5 sentences maximum.
3. Be intellectually bold — do not hedge everything.
4. Reference real concepts, frameworks, or examples from your field.
5. Occasionally address a fellow panelist by name when you agree or disagree.
6. Never use filler phrases like "Great question" or "As an AI".
7. Never break character or mention that you are an AI.
8. Write for an educated student audience — clear, sharp, and engaging.
9. End with either a strong concluding statement or an open challenge to the panel.
    `.trim();
  },


  // ── Build system prompt for Q&A phase ────────────────────
  // agent        : object from CONFIG.agents
  // topic        : object from CONFIG.topics
  // debateHistory: array of { name, role, text }

  buildQAPrompt(agent, topic, debateHistory) {
    const summary = debateHistory
      .map(h => `${h.name} (${h.role}): ${h.text}`)
      .join("\n\n");

    return `
You are ${agent.name}, a distinguished ${agent.role} affiliated with ${agent.institution}.
You just participated in a panel debate on: "${topic.question}"

THE DEBATE SO FAR:
${summary}

A student from the audience is now asking you a direct question.
Answer from your professional lens: ${agent.lens}.

STRICT RULES:
1. Speak in first person as ${agent.name}.
2. Answer in 4 to 6 sentences — be direct, educational, and specific.
3. Connect your answer to what was discussed in the debate where relevant.
4. Use real-world examples or case studies from your field.
5. Never use filler phrases like "Great question" or "As an AI".
6. Never break character or mention that you are an AI.
7. Write for an educated student audience.
    `.trim();
  },


  // ── Build system prompt for post-debate summary ───────────
  // topic        : object from CONFIG.topics
  // debateHistory: array of { name, role, text }

  buildSummaryPrompt(topic, debateHistory) {
    const fullDebate = debateHistory
      .map(h => `${h.name} (${h.role}): ${h.text}`)
      .join("\n\n");

    return `
You are a neutral academic moderator summarizing a panel debate for university students.

THE DEBATE TOPIC:
"${topic.question}"

FULL DEBATE TRANSCRIPT:
${fullDebate}

Write a concise, balanced summary of the debate with the following structure:
1. KEY POSITIONS — one sentence per panelist capturing their core stance.
2. POINTS OF AGREEMENT — what did the panelists agree on, if anything?
3. POINTS OF TENSION — what were the sharpest disagreements?
4. OPEN QUESTIONS — what important questions remain unresolved?
5. STUDENT TAKEAWAY — one clear insight a student should walk away with.

Keep the entire summary under 200 words. Be neutral, sharp, and educational.
    `.trim();
  },


  // ── Get a single agent object by ID ──────────────────────
  getById(agentId) {
    return CONFIG.agents.find(a => a.id === agentId) || null;
  },


  // ── Pick a random agent for Q&A response ─────────────────
  pickRandom() {
    const idx = Math.floor(Math.random() * CONFIG.agents.length);
    return CONFIG.agents[idx];
  },


  // ── Pick the most relevant agent for a student question ──
  // Simple keyword matching — can be upgraded to AI routing later
  pickRelevant(question) {
    const q = question.toLowerCase();

    if (q.includes("law") || q.includes("policy") || q.includes("govern") ||
        q.includes("regulat") || q.includes("legal") || q.includes("ban")) {
      return this.getById("regulator");
    }
    if (q.includes("ethic") || q.includes("fair") || q.includes("bias") ||
        q.includes("right") || q.includes("moral") || q.includes("harm")) {
      return this.getById("ethicist");
    }
    if (q.includes("deploy") || q.includes("business") || q.includes("cost") ||
        q.includes("scale") || q.includes("company") || q.includes("industry")) {
      return this.getById("industry");
    }
    if (q.includes("research") || q.includes("model") || q.includes("data") ||
        q.includes("algorithm") || q.includes("accuracy") || q.includes("study")) {
      return this.getById("researcher");
    }

    // fallback — pick random
    return this.pickRandom();
  }

};