const API_BASE_URL = process.env.SERVER_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();

  if (!payload?.ok) {
    const error = payload?.error || { message: 'Unexpected API error', code: 'UNKNOWN_ERROR' };
    throw new ApiError(error.message, error.code, error.details || null);
  }

  return payload.data;
}

export async function submitText(rawText) {
  return request('/api/submissions', {
    method: 'POST',
    body: JSON.stringify({ rawText })
  });
}

export async function fetchHistory() {
  return request('/api/history');
}

export async function fetchRanking() {
  return request('/api/ranking');
}
