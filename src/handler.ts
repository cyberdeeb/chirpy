import { Request, Response } from 'express';
import { config } from './config.js';

export function handlerReadiness(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('OK');
}

export async function handlerMetrics(req: Request, res: Response) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileServerHits} times!</p>
  </body>
</html>
`);
}

export function handlerReset(req: Request, res: Response) {
  config.fileServerHits = 0;
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('Hits reset to 0');
}
