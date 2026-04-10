// ============================================================
//  GENAI CLASSROOM — api.js
//  Supports Groq, Gemini, OpenRouter, Anthropic
// ============================================================

const API = {

  // ── Endpoints ─────────────────────────────────────────────
  endpoints: {
    groq:       "https://api.groq.com/openai/v1/chat/completions",
    gemini:     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    anthropic:  "https://api.anthropic.com/v1/messages"
  },

  // ── API key set by student via UI ─────────────────────────
  apiKey: null,

  // ── Active provider — set when student connects ───────────
  activeProvider: "groq",


  // ── Set key and provider together ────────────────────────
setKey(key, provider) {
  this.apiKey        = key.trim();
  this.activeProvider = provider;
},

  // ── Validate key format ───────────────────────────────────
  isKeySet() {
  if (!this.apiKey) return false;
  const provider = CONFIG.providers[this.activeProvider];
  return provider ? this.apiKey.startsWith(provider.keyPrefix) : false;
},

  // ── Master call ───────────────────────────────────────────
  async call(systemPrompt, messages) {
  switch (this.activeProvider) {
    case "groq":       return await this._callGroq(systemPrompt, messages);
    case "gemini":     return await this._callGemini(systemPrompt, messages);
    case "openrouter": return await this._callOpenRouter(systemPrompt, messages);
    case "anthropic":  return await this._callAnthropic(systemPrompt, messages);
    default:           return "Provider not configured.";
  }
},

  // ── Groq ──────────────────────────────────────────────────
  async _callGroq(systemPrompt, messages) {
    try {
      const res = await fetch(this.endpoints.groq, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model:      CONFIG.getModel(),
          max_tokens: CONFIG.getMaxTokens(),
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ]
        })
      });
      if (!res.ok) return this._errorMessage(res.status, "groq");
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "No response.";
    } catch (e) {
      return "Connection error. Check your internet.";
    }
  },


  // ── Gemini ────────────────────────────────────────────────
  async _callGemini(systemPrompt, messages) {
    try {
      const url = `${this.endpoints.gemini}?key=${this.apiKey}`;

      // convert messages to Gemini format
      const contents = messages.map(m => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: CONFIG.getMaxTokens() }
        })
      });
      if (!res.ok) return this._errorMessage(res.status, "gemini");
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response.";
    } catch (e) {
      return "Connection error. Check your internet.";
    }
  },


  // ── OpenRouter ────────────────────────────────────────────
  async _callOpenRouter(systemPrompt, messages) {
    try {
      const res = await fetch(this.endpoints.openrouter, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer":  "https://genai-classroom.mecit.edu.om",
          "X-Title":       "GenAI Classroom"
        },
        body: JSON.stringify({
          model:      CONFIG.getModel(),
          max_tokens: CONFIG.getMaxTokens(),
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ]
        })
      });
      if (!res.ok) return this._errorMessage(res.status, "openrouter");
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "No response.";
    } catch (e) {
      return "Connection error. Check your internet.";
    }
  },


  // ── Anthropic ─────────────────────────────────────────────
  async _callAnthropic(systemPrompt, messages) {
    try {
      const res = await fetch(this.endpoints.anthropic, {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model:      CONFIG.getModel(),
          max_tokens: CONFIG.getMaxTokens(),
          system:     systemPrompt,
          messages
        })
      });
      if (!res.ok) return this._errorMessage(res.status, "anthropic");
      const data = await res.json();
      return data.content?.find(b => b.type === "text")?.text?.trim() || "No response.";
    } catch (e) {
      return "Connection error. Check your internet.";
    }
  },


  // ── Error messages ────────────────────────────────────────
  _errorMessage(status, provider) {
    switch (status) {
      case 401: return `Invalid ${provider} API key. Please check and try again.`;
      case 403: return "Access denied. Check your API key permissions.";
      case 429: return "Rate limit reached. Please wait a moment and try again.";
      case 500: return "Server error. Please try again shortly.";
      default:  return `API error (${status}). Please try again.`;
    }
  },


  // ── Build messages array ──────────────────────────────────
  buildMessages(history, newUserMessage) {
    const trimmed = history.slice(-CONFIG.debate.maxDebateHistory);
    return [...trimmed, { role: "user", content: newUserMessage }];
  }

};