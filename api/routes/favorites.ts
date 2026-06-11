import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const FAV_PATH = path.join(__dirname, '..', 'data', 'favorites.json');

const getFavs = (): string[] => {
  if (!fs.existsSync(FAV_PATH)) {
    const seed = ['drv-nv-55123', 'drv-amd-23121'];
    fs.writeFileSync(FAV_PATH, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(fs.readFileSync(FAV_PATH, 'utf-8'));
};

const saveFavs = (data: string[]) => {
  fs.writeFileSync(FAV_PATH, JSON.stringify(data));
};

router.get('/', (_req: Request, res: Response) => {
  const favIds = getFavs();
  const driversPath = path.join(__dirname, '..', 'data', 'drivers.json');
  const allDrivers = JSON.parse(fs.readFileSync(driversPath, 'utf-8'));
  const favDrivers = allDrivers.filter((d: any) => favIds.includes(d.id));
  res.json(favDrivers);
});

router.post('/:driverId', (req: Request, res: Response) => {
  const favs = getFavs();
  if (!favs.includes(req.params.driverId)) {
    favs.push(req.params.driverId);
    saveFavs(favs);
  }
  res.json({ success: true, favorites: favs });
});

router.delete('/:driverId', (req: Request, res: Response) => {
  const favs = getFavs().filter(id => id !== req.params.driverId);
  saveFavs(favs);
  res.json({ success: true, favorites: favs });
});

export default router;
