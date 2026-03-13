const { GoogleGenAI } = require('@google/genai');
const { normalizeAnalysis } = require('../utils/validation');

const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['title', 'category', 'priority', 'entities', 'summary'],
  properties: {
    title: { type: 'string' },
    category: { type: 'string' },
    priority: { type: 'string' },
    entities: {
      type: 'array',
      items: { type: 'string' }
    },
    summary: { type: 'string' }
  }
};

function buildPrompt(input) {
  return [
    'You are an intelligence triage assistant.',
    'Return JSON only with keys: title, category, priority, entities, summary.',
    'Allowed priority values: low, medium, high, critical.',
    'Infer category succinctly (security, operations, finance, policy, incident, other).',
    `Text:\n${input.text}`,
    input.contributor ? `Contributor: ${input.contributor}` : 'Contributor: unknown',
    input.image ? `Image attached with mimeType ${input.image.mimeType}.` : 'No image supplied.'
  ].join('\n');
}

function safeJsonParse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function fallbackAnalysis(input) {
  const topWords = input.text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5);

  return normalizeAnalysis({
    title: input.text.split('.').at(0)?.slice(0, 80) || 'Untitled Intelligence',
    category: 'other',
    priority: 'medium',
    entities: Array.from(new Set(topWords)),
    summary: input.text.slice(0, 280)
  });
}

async function analyzeIntelligence(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      analysis: fallbackAnalysis(input),
      source: 'fallback',
      warning: 'GEMINI_API_KEY is not configured.'
    };
  }

  const client = new GoogleGenAI({ apiKey });

  const contents = [{ role: 'user', parts: [{ text: buildPrompt(input) }] }];
  if (input.image) {
    contents[0].parts.push({
      inlineData: {
        mimeType: input.image.mimeType,
        data: input.image.data
      }
    });
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2
      }
    });

    const rawText = response?.text || '';
    const parsed = safeJsonParse(rawText);

    if (!parsed) {
      return {
        analysis: fallbackAnalysis(input),
        source: 'fallback',
        warning: 'Unable to parse model output as JSON.'
      };
    }

    return {
      analysis: normalizeAnalysis(parsed),
      source: 'gemini'
    };
  } catch (error) {
    return {
      analysis: fallbackAnalysis(input),
      source: 'fallback',
      warning: `Gemini request failed: ${error.message}`
    };
  }
}

module.exports = {
  analyzeIntelligence
};
