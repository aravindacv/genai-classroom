// ============================================================
//  GENAI CLASSROOM — config.js
//  Supports multiple free providers + Anthropic upgrade
// ============================================================

const CONFIG = {

  // ── App identity ──────────────────────────────────────────
  appName:    "GenAI Classroom",
  appTagline: "Multi-Agent Interactive Learning",
  // version:    "2.0.0",

  // ── Available providers ───────────────────────────────────
  // Students pick one — recommended shown in UI
  providers: {
    groq: {
      id:          "groq",
      label:       "Groq",
      badge:       "Free",
      badgeColor:  "#6ecfad",
      description: "Fast and free — great for getting started",
      signupUrl:   "https://console.groq.com/keys",
      keyPrefix:   "gsk_",
      keyHint:     "Paste your Groq key — starts with gsk_",
      recommended: false
    },
    gemini: {
      id:          "gemini",
      label:       "Google Gemini",
      badge:       "Free",
      badgeColor:  "#6ecfad",
      description: "Free tier with generous limits from Google",
      signupUrl:   "https://aistudio.google.com/app/apikey",
      keyPrefix:   "AIza",
      keyHint:     "Paste your Gemini key — starts with AIza",
      recommended: false
    },
    openrouter: {
      id:          "openrouter",
      label:       "OpenRouter",
      badge:       "Free models",
      badgeColor:  "#6ecfad",
      description: "Access multiple free AI models in one place",
      signupUrl:   "https://openrouter.ai/keys",
      keyPrefix:   "sk-or-",
      keyHint:     "Paste your OpenRouter key — starts with sk-or-",
      recommended: false
    },
    anthropic: {
      id:          "anthropic",
      label:       "Anthropic Claude",
      badge:       "Best quality",
      badgeColor:  "#a89ef5",
      description: "Most accurate and realistic debate responses",
      signupUrl:   "https://console.anthropic.com",
      keyPrefix:   "sk-ant-",
      keyHint:     "Paste your Anthropic key — starts with sk-ant-",
      recommended: true
    }
  },

  // ── Active provider — set when student connects key ───────
  provider: "groq",

  // ── Models per provider ───────────────────────────────────
  models: {
    groq:       "llama-3.3-70b-versatile",
    gemini:     "gemini-2.0-flash",
    openrouter: "meta-llama/llama-3.3-70b-instruct:free",
    anthropic:  "claude-opus-4-5"
  },

  // ── Max tokens per provider ───────────────────────────────
  maxTokens: {
    groq:       1024,
    gemini:     1024,
    openrouter: 1024,
    anthropic:  1024
  },

  // ── Agent personas ────────────────────────────────────────
  agents: [
    {
      id:          "researcher",
      name:        "Dr. Lena Varkov",
      role:        "AI Researcher",
      institution: "Global AI Research Institute",
      avatar:      "🔬",
      color:       "#a89ef5",
      bgColor:     "rgba(83,74,183,0.20)",
      lens:        "scientific rigor, peer-reviewed evidence, emerging research findings, and technical accuracy"
    },
    {
      id:          "ethicist",
      name:        "Prof. James Okafor",
      role:        "AI Ethicist",
      institution: "Institute for Digital Ethics",
      avatar:      "⚖️",
      color:       "#f5a07a",
      bgColor:     "rgba(153,60,29,0.20)",
      lens:        "ethical principles, fairness, societal impact, human rights, and moral responsibility"
    },
    {
      id:          "industry",
      name:        "Dr. Maya Strom",
      role:        "Industry Expert",
      institution: "Former CISO · TechCorp Global",
      avatar:      "🏭",
      color:       "#6ecfad",
      bgColor:     "rgba(15,110,86,0.20)",
      lens:        "real-world deployment, business constraints, scalability, and practical implementation challenges"
    },
    {
      id:          "regulator",
      name:        "Mr. Leon Adeyemi",
      role:        "Policy Regulator",
      institution: "International Cyber Policy Forum",
      avatar:      "🏛️",
      color:       "#7ab8f5",
      bgColor:     "rgba(24,95,165,0.20)",
      lens:        "governance frameworks, international law, public accountability, and policy enforcement"
    }
  ],

  // ── Debate topics ─────────────────────────────────────────
  topics: [
    {
      id:       "t1",
      label:    "AI in autonomous cyberattack attribution",
      question: "Should AI systems be used to autonomously attribute and respond to cyberattacks without human oversight?"
    },
    {
      id:       "t2",
      label:    "Zero-trust: always the right model?",
      question: "Is zero-trust architecture always the right security model for every organization, or does it create new risks?"
    },
    {
      id:       "t3",
      label:    "Mandatory AI explainability in security tools",
      question: "Should governments mandate full explainability and transparency in AI-powered cybersecurity tools?"
    },
    {
      id:       "t4",
      label:    "Offensive AI research for defensive purposes",
      question: "Is developing offensive AI capabilities ethically justified when the stated goal is national defense?"
    },
    {
      id:       "t5",
      label:    "Air-gapping critical infrastructure",
      question: "Should all critical national infrastructure be air-gapped from the public internet, regardless of operational cost?"
    },
    {
      id:       "t6",
      label:    "Generative AI and social engineering attacks",
      question: "Has generative AI fundamentally changed the threat landscape for social engineering and phishing attacks?"
    },
    {
      id:       "t7",
      label:    "AI surveillance vs. citizen privacy",
      question: "Where should the line be drawn between AI-powered national security surveillance and individual privacy rights?"
    },
    {
      id:       "t8",
      label:    "Autonomous weapons and AI decision-making",
      question: "Should autonomous weapon systems be permitted to make lethal decisions without real-time human authorization?"
    }
  ],

  // ── Debate settings ───────────────────────────────────────
  debate: {
    roundsPerDebate:     2,
    delayBetweenAgents:  600,
    maxDebateHistory:    20
  },

  // ── UI settings ───────────────────────────────────────────
  ui: {
    showInstitution:     true,
    enableStudentVoting: true,
    enableSummary:       true
  },

  // ── Helpers ───────────────────────────────────────────────
  getModel()     { return this.models[this.provider]; },
  getMaxTokens() { return this.maxTokens[this.provider]; },
  getProvider()  { return this.providers[this.provider]; }

};