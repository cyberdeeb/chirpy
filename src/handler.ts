import { Request, Response } from 'express';
import { config } from './config.js';
import { createUser, deleteAllUsers } from './db/queries/users.js';

export async function handlerReadiness(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('OK');
}

export async function handlerMetrics(req: Request, res: Response) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileServerHits} times!</p>
  </body>
</html>
`);
}

export async function handlerReset(req: Request, res: Response) {
  if (config.api.platform !== 'development') {
    res.status(403).send('Reset is only allowed in development platform');
    return;
  }
  config.api.fileServerHits = 0;
  await deleteAllUsers();
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

export async function handlerCreateUser(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const newUser = await createUser({ email });

    res.status(201).json({
      id: newUser.id,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      email: newUser.email,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}
