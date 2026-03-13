const express = require('express');
const { analyzeIntelligence } = require('./services/genaiService');
const { createHttpError, validateSubmissionPayload } = require('./utils/validation');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const intelligenceFeed = [];
let idCounter = 1;

function success(res, data, meta = undefined, status = 200) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

app.post('/api/intelligence', async (req, res, next) => {
  try {
    const payload = validateSubmissionPayload(req.body);
    const analysisResult = await analyzeIntelligence(payload);

    const entry = {
      id: idCounter++,
      submittedAt: new Date().toISOString(),
      text: payload.text,
      contributor: payload.contributor || 'anonymous',
      image: payload.image ? { mimeType: payload.image.mimeType } : null,
      ...analysisResult.analysis
    };

    intelligenceFeed.unshift(entry);

    return success(
      res,
      {
        intelligence: entry,
        source: analysisResult.source,
        warning: analysisResult.warning || null
      },
      undefined,
      201
    );
  } catch (error) {
    return next(error);
  }
});

app.get('/api/intelligence', (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';

    const entityQuery = typeof req.query.entity === 'string'
      ? req.query.entity.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
      : [];

    const filtered = intelligenceFeed.filter((item) => {
      const inText = !q || [item.title, item.summary, item.text].some((field) => field.toLowerCase().includes(q));
      const inCategory = !category || item.category === category;
      const hasEntities = entityQuery.length === 0
        || entityQuery.every((needle) => item.entities.some((entity) => entity.toLowerCase().includes(needle)));
      return inText && inCategory && hasEntities;
    });

    return success(res, filtered, {
      total: filtered.length,
      filters: {
        q: q || null,
        category: category || null,
        entity: entityQuery
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/rankings', (req, res) => {
  const contributorStats = intelligenceFeed.reduce((acc, entry) => {
    const name = entry.contributor || 'anonymous';
    if (!acc[name]) {
      acc[name] = { contributor: name, submissions: 0, highPriority: 0 };
    }
    acc[name].submissions += 1;
    if (entry.priority === 'high' || entry.priority === 'critical') {
      acc[name].highPriority += 1;
    }
    return acc;
  }, {});

  const leaderboard = Object.values(contributorStats)
    .sort((a, b) => b.submissions - a.submissions || b.highPriority - a.highPriority)
    .slice(0, 10);

  const starOfMonth = leaderboard[0] || null;

  return success(res, {
    starOfMonth,
    totals: {
      submissions: intelligenceFeed.length,
      highPriority: intelligenceFeed.filter((entry) => entry.priority === 'high' || entry.priority === 'critical').length
    },
    activeMembers: Object.keys(contributorStats).length,
    leaderboard
  });
});

app.use((req, res, next) => {
  next(createHttpError(404, `Route ${req.method} ${req.path} not found.`));
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload.'
      }
    });
  }

  const status = Number(error.status) || 500;
  const message = status >= 500 ? 'Internal server error.' : error.message;

  return res.status(status).json({
    success: false,
    error: {
      code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
      message,
      details: error.details || null
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`IntelligenceHub API listening on port ${PORT}`);
  });
}

module.exports = app;
