import { Request, Response } from 'express';

export function middlewareLogResponses(
  req: Request,
  res: Response,
  next: () => void
) {
  res.on('finish', () => {
    const status_code = res.statusCode;

    if (status_code !== 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.originalUrl} - Status: ${status_code}`
      );
    }
  });

  next();
}
