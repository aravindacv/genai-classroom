// ============================================================
//  GENAI CLASSROOM — debate.js
//  Controls the full debate flow, rounds, Q&A, and summary
// ============================================================

const DEBATE = {

  // ── State ─────────────────────────────────────────────────
  isRunning:     false,
  currentTopic:  null,
  history:       [],       // { name, role, id, text }
  messageHistory:[],       // Claude API format { role, content }
  round:         0,
  votes:         {},       // { messageId: count }


  // ── Reset state for a new debate ─────────────────────────
  reset() {
    this.isRunning      = false;
    this.currentTopic   = null;
    this.history        = [];
    this.messageHistory = [];
    this.round          = 0;
    this.votes          = {};
  },


  // ── Start a full debate ───────────────────────────────────
  // topicId : string — matches CONFIG.topics[].id
  // onMessage : callback(agent, text, msgId) — called per agent response
  // onStatus  : callback(statusText)         — called for status updates
  // onComplete: callback()                   — called when debate ends

  async start(topicOrId, onMessage, onStatus, onComplete) {
    if (this.isRunning) return;

    // accept either a topic object or a topic id string
    const topic = typeof topicOrId === "object"
      ? topicOrId
      : CONFIG.topics.find(t => t.id === topicOrId);

    if (!topic) { onStatus("Invalid topic selected."); return; }
    
    if (!API.isKeySet()) {
      onStatus("API key not set. Please add your key in api.js.");
      return;
    }

    this.reset();
    this.isRunning    = true;
    this.currentTopic = topic;

    onStatus("Debate starting...");

    const totalRounds = CONFIG.debate.roundsPerDebate;

    // ── Run each round ──────────────────────────────────────
    for (let round = 1; round <= totalRounds; round++) {
      this.round = round;
      onStatus(`Round ${round} of ${totalRounds} — agents are speaking...`);

      for (let i = 0; i < CONFIG.agents.length; i++) {
        const agent   = CONFIG.agents[i];
        const isFirst = (round === 1 && i === 0);

        // notify UI that agent is typing
        onMessage(agent, null, null, true);

        // build system prompt for this agent and round
        const systemPrompt = AGENTS.buildSystemPrompt(agent, topic, round, isFirst);

        // build context message for this agent
        const contextMsg = this._buildContextMessage(round, i);

        // call Claude API
        const messages = API.buildMessages(this.messageHistory, contextMsg);
        const text     = await API.call(systemPrompt, messages);

        // generate unique message ID
        const msgId = `msg-${agent.id}-r${round}`;

        // save to history
        this.history.push({ id: msgId, name: agent.name, role: agent.role, agentId: agent.id, text, round });

        // update Claude message history for next agent context
        this.messageHistory.push(
          { role: "user",      content: contextMsg },
          { role: "assistant", content: text }
        );

        // initialise vote count for this message
        this.votes[msgId] = 0;

        // send to UI
        onMessage(agent, text, msgId, false);

        // delay between agents
        await this._delay(CONFIG.debate.delayBetweenAgents);
      }
    }

    // ── Post-debate summary ─────────────────────────────────
    if (CONFIG.ui.enableSummary) {
      onStatus("Generating debate summary...");
      await this._generateSummary(onMessage, onStatus);
    }

    this.isRunning = false;
    onStatus("Debate complete. Ask the panel a question below.");
    onComplete();
  },


  // ── Handle a student question ─────────────────────────────
  // question  : string
  // onMessage : callback(agent, text, msgId, isTyping)
  // onStatus  : callback(statusText)

  async ask(question, onMessage, onStatus) {
    if (!this.currentTopic) {
      onStatus("Please start a debate first.");
      return;
    }
    if (!API.isKeySet()) {
      onStatus("API key not set. Please add your key in api.js.");
      return;
    }
    if (question.trim() === "") {
      onStatus("Please type a question first.");
      return;
    }

    onStatus("Panel is considering your question...");

    // pick the most relevant agent
    const agent = AGENTS.pickRelevant(question);

    // show typing indicator
    onMessage(agent, null, null, true);

    // build Q&A prompt
    const systemPrompt = AGENTS.buildQAPrompt(agent, this.currentTopic, this.history);

    // call Claude
    const messages = [{ role: "user", content: question }];
    const text     = await API.call(systemPrompt, messages);

    const msgId = `qa-${agent.id}-${Date.now()}`;
    this.votes[msgId] = 0;

    onMessage(agent, text, msgId, false);
    onStatus("Ready for your next question.");
  },


  // ── Upvote a message ──────────────────────────────────────
  vote(msgId) {
    if (this.votes[msgId] !== undefined) {
      this.votes[msgId]++;
      return this.votes[msgId];
    }
    return 0;
  },


  // ── Generate post-debate summary ──────────────────────────
  async _generateSummary(onMessage, onStatus) {
    const summaryAgent = {
      id:      "moderator",
      name:    "Moderator",
      role:    "Academic Moderator",
      avatar:  "📋",
      color:   "#5F5E5A",
      bgColor: "#F1EFE8"
    };

    onMessage(summaryAgent, null, null, true);

    const systemPrompt = AGENTS.buildSummaryPrompt(this.currentTopic, this.history);
    const messages     = [{ role: "user", content: "Please summarize the debate now." }];
    const text         = await API.call(systemPrompt, messages);

    const msgId = "summary-" + Date.now();
    this.votes[msgId] = 0;

    onMessage(summaryAgent, text, msgId, false);
    onStatus("Summary generated.");
  },


  // ── Build context message passed to each agent ────────────
  _buildContextMessage(round, agentIndex) {
    if (this.history.length === 0) {
      return `The debate topic is: "${this.currentTopic.question}". You are opening the debate. Please share your perspective.`;
    }

    const recent = this.history.slice(-6);
    const transcript = recent
      .map(h => `${h.name} (${h.role}): ${h.text}`)
      .join("\n\n");

    return `
The debate topic is: "${this.currentTopic.question}"

Recent discussion:
${transcript}

It is now your turn to speak in round ${round}. Engage with what has been said and advance your position.
    `.trim();
  },


  // ── Simple async delay ────────────────────────────────────
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

};