const API = {

  endpoints: {
    groq:       "https://api.groq.com/openai/v1/chat/completions",
    gemini:     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    anthropic:  "https://api.anthropic.com/v1/messages"
  },

  apiKey:         null,
  activeProvider: "groq",

  setKey(key, provider) {
    this.apiKey         = key.trim();
    this.activeProvider = provider;
    console.log("API.setKey — activeProvider:", this.activeProvider);
  },

  isKeySet() {
    if (!this.apiKey) return false;
    const provider = CONFIG.providers[this.activeProvider];
    return provider ? this.apiKey.startsWith(provider.keyPrefix) : false;
  },

  getKeyHint() {
    return CONFIG.providers[this.activeProvider]?.keyHint || "Paste your API key";
  },

  getSignupLink() {
    return CONFIG.providers[this.activeProvider]?.signupUrl || "#";
  },

  getProviderLabel() {
    return CONFIG.providers[this.activeProvider]?.label || "AI Provider";
  },

  async call(systemPrompt, messages) {
    console.log("API.call — provider:", this.activeProvider);
    switch (this.activeProvider) {
      case "groq":       return await this._callGroq(systemPrompt, messages);
      case "gemini":     return await this._callGemini(systemPrompt, messages);
      case "openrouter": return await this._callOpenRouter(systemPrompt, messages);
      case "anthropic":  return await this._callAnthropic(systemPrompt, messages);
      default:           return "Provider not configured.";
    }
  },

  async _callGroq(systemPrompt, messages) {
    try {
      const res = await fetch(this.endpoints.groq, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model:      CONFIG.models.groq,
          max_tokens: CONFIG.maxTokens.groq,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ]
        })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Groq error:", err);
        return this._errorMessage(res.status, "groq");
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "No response.";
    } catch (e) {
      console.error("Groq network error:", e);
      return "Connection error. Check your internet.";
    }
  },

  async _callGemini(systemPrompt, messages) {
    try {
      const url = `${this.endpoints.gemini}?key=${this.apiKey}`;
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
          generationConfig:   { maxOutputTokens: CONFIG.maxTokens.gemini }
        })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Gemini error:", err);
        return this._errorMessage(res.status, "gemini");
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        || "No response.";
    } catch (e) {
      console.error("Gemini network error:", e);
      return "Connection error. Check your internet.";
    }
  },

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
          model:      CONFIG.models.openrouter,
          max_tokens: CONFIG.maxTokens.openrouter,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ]
        })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("OpenRouter error:", err);
        return this._errorMessage(res.status, "openrouter");
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "No response.";
    } catch (e) {
      console.error("OpenRouter network error:", e);
      return "Connection error. Check your internet.";
    }
  },

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
          model:      CONFIG.models.anthropic,
          max_tokens: CONFIG.maxTokens.anthropic,
          system:     systemPrompt,
          messages
        })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Anthropic error:", err);
        return this._errorMessage(res.status, "anthropic");
      }
      const data = await res.json();
      return data.content?.find(b => b.type === "text")?.text?.trim()
        || "No response.";
    } catch (e) {
      console.error("Anthropic network error:", e);
      return "Connection error. Check your internet.";
    }
  },

  _errorMessage(status, provider) {
    switch (status) {
      case 401: return `Invalid ${provider} API key. Please check and try again.`;
      case 403: return "Access denied. Check your API key permissions.";
      case 429: return "Rate limit reached. Please wait a moment and try again.";
      case 500: return "Server error. Please try again shortly.";
      default:  return `API error (${status}). Please try again.`;
    }
  },

  buildMessages(history, newUserMessage) {
    const trimmed = history.slice(-CONFIG.debate.maxDebateHistory);
    return [...trimmed, { role: "user", content: newUserMessage }];
  }

};