import express from 'express';
import { handlerReadiness } from '../handler.js';

const app = express();
const PORT = 8080;

app.use('/app', express.static('./src/app'));
app.get('/healthz', handlerReadiness);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
