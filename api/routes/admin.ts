import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Driver } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const DRIVERS_PATH = path.join(__dirname, '..', 'data', 'drivers.json');

const getDrivers = (): Driver[] => {
  return JSON.parse(fs.readFileSync(DRIVERS_PATH, 'utf-8'));
};

const saveDrivers = (data: Driver[]) => {
  fs.writeFileSync(DRIVERS_PATH, JSON.stringify(data, null, 2));
};

router.get('/pending-drivers', (_req: Request, res: Response) => {
  const drivers = getDrivers().filter(d => d.status === 'pending');
  res.json(drivers);
});

router.get('/stats', (_req: Request, res: Response) => {
  const drivers = getDrivers();
  res.json({
    total: drivers.length,
    approved: drivers.filter(d => d.status === 'approved').length,
    pending: drivers.filter(d => d.status === 'pending').length,
    rejected: drivers.filter(d => d.status === 'rejected').length,
  });
});

router.post('/drivers/:id/approve', (req: Request, res: Response) => {
  const drivers = getDrivers();
  const idx = drivers.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }
  drivers[idx] = { ...drivers[idx], status: 'approved' };
  saveDrivers(drivers);
  res.json(drivers[idx]);
});

router.post('/drivers/:id/reject', (req: Request, res: Response) => {
  const drivers = getDrivers();
  const idx = drivers.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }
  drivers[idx] = { ...drivers[idx], status: 'rejected' };
  saveDrivers(drivers);
  res.json(drivers[idx]);
});

router.post('/mirrors/toggle', (req: Request, res: Response) => {
  const { driverId, mirrorId, enabled } = req.body;
  const drivers = getDrivers();
  const dIdx = drivers.findIndex(d => d.id === driverId);
  if (dIdx === -1) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }
  const mIdx = drivers[dIdx].mirrors.findIndex(m => m.id === mirrorId);
  if (mIdx === -1) {
    res.status(404).json({ error: 'Mirror not found' });
    return;
  }
  drivers[dIdx].mirrors[mIdx].enabled = enabled;
  saveDrivers(drivers);
  res.json(drivers[dIdx]);
});

export default router;
