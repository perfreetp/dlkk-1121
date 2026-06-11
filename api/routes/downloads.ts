import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DownloadRecord } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const DATA_PATH = path.join(__dirname, '..', 'data', 'downloads.json');

const getDownloads = (): DownloadRecord[] => {
  if (!fs.existsSync(DATA_PATH)) {
    const seed: DownloadRecord[] = [
      {
        id: 'dl-001',
        driverId: 'drv-nv-55123',
        driverName: 'GeForce Game Ready 551.23 WHQL',
        version: '551.23',
        mirrorId: 'm2',
        status: 'completed',
        progress: 100,
        size: '1.35 GB',
        startTime: '2024-02-10T08:30:00Z',
        completedTime: '2024-02-10T08:34:20Z'
      },
      {
        id: 'dl-002',
        driverId: 'drv-amd-23121',
        driverName: 'AMD Radeon Software 23.12.1',
        version: '23.12.1',
        mirrorId: 'm1',
        status: 'downloading',
        progress: 62,
        size: '1.58 GB',
        startTime: '2024-02-11T14:05:00Z'
      },
      {
        id: 'dl-003',
        driverId: 'drv-nv-54617',
        driverName: 'GeForce Game Ready 546.17 WHQL',
        version: '546.17',
        mirrorId: 'm1',
        status: 'failed',
        progress: 38,
        size: '1.28 GB',
        startTime: '2024-02-09T21:12:00Z'
      },
      {
        id: 'dl-004',
        driverId: 'drv-intel-5078',
        driverName: 'Intel Arc Graphics Driver 5078',
        version: '31.0.101.5078',
        mirrorId: 'm2',
        status: 'completed',
        progress: 100,
        size: '892 MB',
        startTime: '2024-02-01T11:00:00Z',
        completedTime: '2024-02-01T11:02:45Z'
      }
    ];
    fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
};

const saveDownloads = (data: DownloadRecord[]) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

router.get('/', (_req: Request, res: Response) => {
  const downloads = getDownloads().sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  res.json(downloads);
});

router.post('/', (req: Request, res: Response) => {
  const downloads = getDownloads();
  const newItem: DownloadRecord = {
    id: `dl-${Date.now()}`,
    ...req.body,
    progress: 0,
    status: 'downloading',
    startTime: new Date().toISOString(),
  };
  downloads.unshift(newItem);
  saveDownloads(downloads);
  res.status(201).json(newItem);
});

router.patch('/:id', (req: Request, res: Response) => {
  const downloads = getDownloads();
  const idx = downloads.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Download not found' });
    return;
  }
  const updated = { ...downloads[idx], ...req.body };
  if (updated.status === 'completed' && !updated.completedTime) {
    updated.completedTime = new Date().toISOString();
  }
  downloads[idx] = updated;
  saveDownloads(downloads);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const downloads = getDownloads();
  const filtered = downloads.filter(d => d.id !== req.params.id);
  saveDownloads(filtered);
  res.json({ success: true });
});

export default router;
