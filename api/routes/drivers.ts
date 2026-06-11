import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Driver } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const DATA_PATH = path.join(__dirname, '..', 'data', 'drivers.json');

const getDrivers = (): Driver[] => {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
};

const saveDrivers = (drivers: Driver[]) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(drivers, null, 2));
};

router.get('/', (req: Request, res: Response) => {
  const { gpuId, brand, status = 'approved', sort = 'releaseDate', order = 'desc' } = req.query;
  let drivers = getDrivers();

  if (status) {
    drivers = drivers.filter(d => d.status === status);
  }
  if (gpuId) {
    drivers = drivers.filter(d => d.gpuIds.includes(String(gpuId)));
  }
  if (brand) {
    const gpusPath = path.join(__dirname, '..', 'data', 'gpus.json');
    const gpus = JSON.parse(fs.readFileSync(gpusPath, 'utf-8')) as any[];
    const brandGpuIds = gpus.filter(g => g.brand === brand).map(g => g.id);
    drivers = drivers.filter(d => d.gpuIds.some(id => brandGpuIds.includes(id)));
  }

  drivers.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case 'downloadCount':
        cmp = a.downloadCount - b.downloadCount;
        break;
      case 'rating':
        cmp = a.rating - b.rating;
        break;
      case 'releaseDate':
      default:
        cmp = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    }
    return order === 'asc' ? cmp : -cmp;
  });

  res.json(drivers);
});

router.get('/gpu/:gpuId', (req: Request, res: Response) => {
  const drivers = getDrivers();
  const result = drivers.filter(d => d.gpuIds.includes(req.params.gpuId) && d.status === 'approved');
  res.json(result);
});

router.get('/popular', (_req: Request, res: Response) => {
  const drivers = getDrivers()
    .filter(d => d.status === 'approved')
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 6);
  res.json(drivers);
});

router.get('/latest', (_req: Request, res: Response) => {
  const drivers = getDrivers()
    .filter(d => d.status === 'approved')
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 5);
  res.json(drivers);
});

router.get('/:id', (req: Request, res: Response) => {
  const drivers = getDrivers();
  const driver = drivers.find(d => d.id === req.params.id);
  if (!driver) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }
  res.json(driver);
});

router.post('/', (req: Request, res: Response) => {
  const drivers = getDrivers();
  const newDriver: Driver = {
    ...req.body,
    id: `drv-user-${Date.now()}`,
    status: 'pending',
    downloadCount: 0,
    rating: 0,
    ratingCount: 0,
    releaseDate: new Date().toISOString().split('T')[0],
  };
  drivers.push(newDriver);
  saveDrivers(drivers);
  res.status(201).json(newDriver);
});

router.post('/:id/rate', (req: Request, res: Response) => {
  const { rating } = req.body;
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Invalid rating' });
    return;
  }
  const drivers = getDrivers();
  const idx = drivers.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }
  const d = drivers[idx];
  const newCount = d.ratingCount + 1;
  const newRating = (d.rating * d.ratingCount + rating) / newCount;
  drivers[idx] = { ...d, rating: Number(newRating.toFixed(1)), ratingCount: newCount };
  saveDrivers(drivers);
  res.json(drivers[idx]);
});

export default router;
