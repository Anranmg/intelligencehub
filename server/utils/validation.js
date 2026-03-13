const MAX_TEXT_LENGTH = 5_000;
const MAX_CONTRIBUTOR_LENGTH = 80;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
]);

const VALID_CATEGORIES = new Set([
  'security',
  'operations',
  'finance',
  'policy',
  'incident',
  'other'
]);

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

function createHttpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) {
    err.details = details;
  }
  return err;
}

function validateSubmissionPayload(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'Payload must be a JSON object.');
  }

  const { text, image, contributor } = body;

  if (typeof text !== 'string' || !text.trim()) {
    throw createHttpError(400, 'Field "text" is required and must be a non-empty string.');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw createHttpError(400, `Field "text" exceeds ${MAX_TEXT_LENGTH} characters.`);
  }

  if (contributor !== undefined) {
    if (typeof contributor !== 'string' || !contributor.trim()) {
      throw createHttpError(400, 'Field "contributor" must be a non-empty string when provided.');
    }
    if (contributor.length > MAX_CONTRIBUTOR_LENGTH) {
      throw createHttpError(400, `Field "contributor" exceeds ${MAX_CONTRIBUTOR_LENGTH} characters.`);
    }
  }

  if (image !== undefined) {
    if (!image || typeof image !== 'object' || Array.isArray(image)) {
      throw createHttpError(400, 'Field "image" must be an object when provided.');
    }

    const { mimeType, data } = image;
    if (typeof mimeType !== 'string' || !SUPPORTED_IMAGE_TYPES.has(mimeType.toLowerCase())) {
      throw createHttpError(400, `Unsupported image type. Allowed: ${Array.from(SUPPORTED_IMAGE_TYPES).join(', ')}`);
    }

    if (typeof data !== 'string' || !data.trim()) {
      throw createHttpError(400, 'Field "image.data" is required and must be a base64 string.');
    }

    let bytes;
    try {
      const cleaned = data.replace(/^data:[^;]+;base64,/, '');
      bytes = Buffer.byteLength(cleaned, 'base64');
    } catch (error) {
      throw createHttpError(400, 'Field "image.data" must be valid base64.');
    }

    if (bytes > MAX_IMAGE_BYTES) {
      throw createHttpError(400, `Image exceeds ${MAX_IMAGE_BYTES} bytes.`);
    }
  }

  return {
    text: text.trim(),
    contributor: contributor?.trim(),
    image: image
      ? {
          mimeType: image.mimeType.toLowerCase(),
          data: image.data.replace(/^data:[^;]+;base64,/, '')
        }
      : undefined
  };
}

function normalizeAnalysis(payload = {}) {
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'Untitled Intelligence';
  const categoryRaw = typeof payload.category === 'string' ? payload.category.toLowerCase().trim() : 'other';
  const category = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : 'other';

  const priorityRaw = typeof payload.priority === 'string' ? payload.priority.toLowerCase().trim() : 'medium';
  const priority = VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : 'medium';

  const entities = Array.isArray(payload.entities)
    ? payload.entities
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 15)
    : [];

  const summary = typeof payload.summary === 'string' && payload.summary.trim()
    ? payload.summary.trim().slice(0, 1_000)
    : 'No summary provided.';

  return { title, category, priority, entities, summary };
}

module.exports = {
  MAX_TEXT_LENGTH,
  MAX_CONTRIBUTOR_LENGTH,
  MAX_IMAGE_BYTES,
  SUPPORTED_IMAGE_TYPES,
  createHttpError,
  validateSubmissionPayload,
  normalizeAnalysis
};
