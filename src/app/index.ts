import express from 'express';
import {
  handlerMetrics,
  handlerReadiness,
  handlerReset,
  handlerValidateChirp,
} from '../handler.js';
import { middlewareLogResponse, middlewareMetricsInc } from '../middleware.js';

const app = express();
const PORT = 8080;
app.use(express.json());

app.use(middlewareLogResponse);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

app.get('/api/healthz', handlerReadiness);
app.post('/api/validate_chirp', handlerValidateChirp);
app.get('/admin/metrics', handlerMetrics);
app.post('/admin/reset', handlerReset);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
