// api/player/profile.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsePlayerProfileHtml } from '../parsePlayerProfile';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  try {
    const html = typeof req.body === 'string' ? req.body : req.body?.html;

    if (!html) {
      res.status(400).json({
        success: false,
        generatedAt: new Date().toISOString(),
        player: null,
        error: 'Missing HTML content in request body.',
      });
      return;
    }

    const result = parsePlayerProfileHtml(html);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      generatedAt: new Date().toISOString(),
      player: null,
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
}
