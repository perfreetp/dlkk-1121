import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/compatibility', (_req: Request, res: Response) => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'compatibility.json'), 'utf-8')
  );
  res.json(data.compatibility);
});

router.get('/bsod', (req: Request, res: Response) => {
  const { code } = req.query;
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'compatibility.json'), 'utf-8')
  );
  let issues = data.bsodIssues;
  if (code) {
    issues = issues.filter((i: any) =>
      i.code.toLowerCase().includes(String(code).toLowerCase())
    );
  }
  res.json(issues);
});

router.get('/announcements', (_req: Request, res: Response) => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'compatibility.json'), 'utf-8')
  );
  res.json(data.announcements);
});

export default router;
