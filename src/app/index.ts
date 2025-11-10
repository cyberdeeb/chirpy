import express from 'express';
import {
  handlerCreateUser,
  handlerMetrics,
  handlerReadiness,
  handlerReset,
  handlerChirp,
} from '../handler.js';
import {
  middlewareErrorHandler,
  middlewareLogResponse,
  middlewareMetricsInc,
} from '../middleware.js';

const app = express();
const PORT = 8080;
app.use(express.json());

app.use(middlewareLogResponse);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

app.get('/api/healthz', (req, res, next) => {
  Promise.resolve(handlerReadiness(req, res)).catch(next);
});
app.get('/admin/metrics', (req, res, next) => {
  Promise.resolve(handlerMetrics(req, res)).catch(next);
});
app.post('/admin/reset', (req, res, next) => {
  Promise.resolve(handlerReset(req, res)).catch(next);
});

app.post('/api/chirps', (req, res, next) => {
  Promise.resolve(handlerChirp(req, res)).catch(next);
});

app.post('/api/users', (req, res, next) => {
  Promise.resolve(handlerCreateUser(req, res)).catch(next);
});

app.use(middlewareErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
