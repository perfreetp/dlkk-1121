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

router.post('/mirrors/update', (req: Request, res: Response) => {
  const { driverId, mirrorId, name, url, speed, backupUrls } = req.body;
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
  if (name !== undefined) drivers[dIdx].mirrors[mIdx].name = String(name);
  if (url !== undefined) drivers[dIdx].mirrors[mIdx].url = String(url);
  if (speed !== undefined && speed !== null && speed !== '') {
    const s = Number(speed);
    if (!isNaN(s)) drivers[dIdx].mirrors[mIdx].speed = s;
    else delete (drivers[dIdx].mirrors[mIdx] as any).speed;
  }
  if (backupUrls !== undefined) {
    if (Array.isArray(backupUrls)) {
      const filtered = backupUrls.map(u => String(u)).filter(Boolean);
      if (filtered.length > 0) drivers[dIdx].mirrors[mIdx].backupUrls = filtered;
      else delete (drivers[dIdx].mirrors[mIdx] as any).backupUrls;
    } else {
      delete (drivers[dIdx].mirrors[mIdx] as any).backupUrls;
    }
  }
  saveDrivers(drivers);
  res.json(drivers[dIdx]);
});

router.post('/mirrors/add', (req: Request, res: Response) => {
  const { driverId, name, url, speed, backupUrls } = req.body;
  if (!driverId || !name || !url) {
    res.status(400).json({ error: 'driverId, name and url are required' });
    return;
  }
  const drivers = getDrivers();
  const dIdx = drivers.findIndex(d => d.id === driverId);
  if (dIdx === -1) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }
  const existingIds = drivers[dIdx].mirrors.map(m => m.id);
  let newId = 'm1';
  let n = 1;
  while (existingIds.includes(newId)) {
    n++;
    newId = `m${n}`;
  }
  const newMirror: any = {
    id: newId,
    name: String(name),
    url: String(url),
    enabled: true,
  };
  if (speed !== undefined && speed !== null && speed !== '') {
    const s = Number(speed);
    if (!isNaN(s)) newMirror.speed = s;
  }
  if (backupUrls && Array.isArray(backupUrls)) {
    const filtered = backupUrls.map(u => String(u)).filter(Boolean);
    if (filtered.length > 0) newMirror.backupUrls = filtered;
  }
  drivers[dIdx].mirrors.push(newMirror);
  saveDrivers(drivers);
  res.json(drivers[dIdx]);
});

export default router;
