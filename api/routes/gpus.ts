import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GpuModel } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const getGpus = (): GpuModel[] => {
  const dataPath = path.join(__dirname, '..', 'data', 'gpus.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
};

router.get('/', (req: Request, res: Response) => {
  const { brand, brands, series, search, sort = 'releaseDate', order = 'desc', os, dateFrom, dateTo } = req.query;
  let gpus = getGpus();

  const driversPath = path.join(__dirname, '..', 'data', 'drivers.json');
  const allDrivers = JSON.parse(fs.readFileSync(driversPath, 'utf-8')) as any[];
  const approvedDrivers = allDrivers.filter(d => d.status === 'approved');

  let hasDriverFilter = false;
  let validGpuIds = new Set<string>();
  if (os || dateFrom || dateTo) {
    hasDriverFilter = true;
    let filteredDrivers = approvedDrivers;
    if (os) {
      const osList = String(os).split(',').filter(Boolean);
      filteredDrivers = filteredDrivers.filter(d =>
        osList.some(osItem =>
          d.osSupport.some((s: string) => s.toLowerCase().includes(osItem.toLowerCase()))
        )
      );
    }
    if (dateFrom) {
      const from = new Date(String(dateFrom)).getTime();
      filteredDrivers = filteredDrivers.filter(d => new Date(d.releaseDate).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(String(dateTo)).getTime();
      filteredDrivers = filteredDrivers.filter(d => new Date(d.releaseDate).getTime() <= to);
    }
    filteredDrivers.forEach(d => d.gpuIds.forEach((id: string) => validGpuIds.add(id)));
  }

  const brandList = brands ? String(brands).split(',').filter(Boolean) : (brand ? [String(brand)] : []);
  if (brandList.length > 0) {
    gpus = gpus.filter(g => brandList.includes(g.brand));
  }
  const seriesList = series ? String(series).split(',').filter(Boolean) : [];
  if (seriesList.length > 0) {
    gpus = gpus.filter(g => seriesList.includes(g.series));
  }
  if (search) {
    const q = String(search).toLowerCase();
    gpus = gpus.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.series.toLowerCase().includes(q) ||
      (g.codename || '').toLowerCase().includes(q)
    );
  }
  if (hasDriverFilter) {
    gpus = gpus.filter(g => validGpuIds.has(g.id));
  }

  gpus.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'driverCount':
        cmp = a.driverCount - b.driverCount;
        break;
      case 'releaseDate':
      default:
        cmp = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    }
    return order === 'asc' ? cmp : -cmp;
  });

  res.json(gpus);
});

router.get('/series', (_req: Request, res: Response) => {
  const gpus = getGpus();
  const seriesMap: Record<string, string[]> = {};
  gpus.forEach(g => {
    if (!seriesMap[g.brand]) seriesMap[g.brand] = [];
    if (!seriesMap[g.brand].includes(g.series)) {
      seriesMap[g.brand].push(g.series);
    }
  });
  const result = Object.entries(seriesMap).map(([brand, series]) => ({ brand, series }));
  res.json(result);
});

router.get('/:id', (req: Request, res: Response) => {
  const gpus = getGpus();
  const gpu = gpus.find(g => g.id === req.params.id);
  if (!gpu) {
    res.status(404).json({ error: 'GPU not found' });
    return;
  }
  res.json(gpu);
});

export default router;
