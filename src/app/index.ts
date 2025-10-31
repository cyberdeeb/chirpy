import express from 'express';
import { handlerMetrics, handlerReadiness, handlerReset } from '../handler.js';
import { middlewareLogResponse, middlewareMetricsInc } from '../middleware.js';

const app = express();
const PORT = 8080;

app.use(middlewareLogResponse);
app.use('/app', middlewareMetricsInc, express.static('./src/app'));
app.get('/healthz', handlerReadiness);
app.get('/metrics', handlerMetrics);
app.get('/reset', handlerReset);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
