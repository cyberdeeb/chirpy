import { Request, Response } from 'express';
import { config } from './config.js';

export async function handlerReadiness(req: Request, res: Response) {
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

export async function handlerReset(req: Request, res: Response) {
  config.fileServerHits = 0;
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('Hits reset to 0');
}

export async function handlerValidateChirp(req: Request, res: Response) {
  type responseBody = {
    cleanedBody?: string;
    error?: string;
  };

  const profane = ['kerfuffle', 'sharbert', 'fornax'];

  const { body } = req.body;

  if (!body || typeof body !== 'string') {
    const response: responseBody = {
      error: 'Missing data field',
    };
    res.status(400).json(response);
    return;
  }

  const maxLength = 140;

  if (body.length > maxLength) {
    const response: responseBody = {
      error: `Chirp is too long. Max length is ${maxLength}`,
    };
    res.status(400).json(response);
    return;
  }

  let updatedBody = '';
  for (const word of body.split(/\s+/)) {
    if (profane.includes(word.toLowerCase())) {
      updatedBody += '**** ';
    } else {
      updatedBody += word + ' ';
    }
  }

  const response: responseBody = { cleanedBody: updatedBody.trim() };
  res.status(200).json(response);
}
