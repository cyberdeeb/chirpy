import { Request, Response } from 'express';
import { config } from './config.js';

export function handlerReadiness(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('OK');
}

export function handlerMetrics(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send(`Hits: ${config.fileserverHits}\n`);
}

export function handlerReset(req: Request, res: Response) {
  config.fileserverHits = 0;
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('Hits reset to 0');
}
