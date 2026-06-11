import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Feedback } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const DATA_PATH = path.join(__dirname, '..', 'data', 'feedback.json');

const getFeedbacks = (): Feedback[] => {
  if (!fs.existsSync(DATA_PATH)) {
    const seed: Feedback[] = [
      {
        id: 'fb-001',
        type: 'broken_link',
        driverId: 'drv-nv-53699',
        driverName: 'GeForce Game Ready 536.99',
        mirrorId: 'm3',
        mirrorName: '阿里云镜像',
        content: '阿里云镜像一直返回404，麻烦检查一下',
        status: 'processing',
        createdAt: '2024-02-05T10:23:00Z',
        reply: '已通知运维人员处理，预计2小时内修复'
      },
      {
        id: 'fb-002',
        type: 'compatibility',
        driverId: 'drv-intel-5078',
        driverName: 'Intel Arc Graphics 5078',
        content: '安装后Premiere Pro 2024硬件加速用不了，回退到上一版就正常',
        rating: 2,
        status: 'pending',
        createdAt: '2024-02-08T15:42:00Z'
      },
      {
        id: 'fb-003',
        type: 'install_issue',
        content: '驱动安装到一半提示"NVIDIA安装程序失败"，重试多次都不行',
        contact: 'user_wang@163.com',
        status: 'resolved',
        createdAt: '2024-01-30T09:15:00Z',
        reply: '建议使用DDU在安全模式下彻底卸载旧驱动后再安装，已为用户发送详细教程邮件'
      }
    ];
    fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
};

const saveFeedbacks = (data: Feedback[]) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

router.get('/', (_req: Request, res: Response) => {
  const feedbacks = getFeedbacks().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(feedbacks);
});

router.post('/', (req: Request, res: Response) => {
  const feedbacks = getFeedbacks();
  const newItem: Feedback = {
    id: `fb-${Date.now()}`,
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  feedbacks.unshift(newItem);
  saveFeedbacks(feedbacks);
  res.status(201).json(newItem);
});

router.patch('/:id', (req: Request, res: Response) => {
  const feedbacks = getFeedbacks();
  const idx = feedbacks.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Feedback not found' });
    return;
  }
  feedbacks[idx] = { ...feedbacks[idx], ...req.body };
  saveFeedbacks(feedbacks);
  res.json(feedbacks[idx]);
});

export default router;
