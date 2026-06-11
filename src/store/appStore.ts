import { create } from 'zustand';
import type { Driver, DownloadRecord } from '@/types';
import { api } from '@/utils/api';

interface AppState {
  favorites: Driver[];
  downloads: DownloadRecord[];
  selectedDriverIds: string[];
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (driverId: string) => Promise<void>;
  fetchDownloads: () => Promise<void>;
  startDownload: (driver: Driver, mirrorId: string) => Promise<void>;
  updateDownloadProgress: (id: string, progress: number, status?: DownloadRecord['status']) => Promise<void>;
  toggleDriverSelection: (driverId: string) => void;
  clearSelection: () => void;
  batchSelect: (ids: string[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  favorites: [],
  downloads: [],
  selectedDriverIds: [],

  fetchFavorites: async () => {
    try {
      const data = await api.favorites.list() as Driver[];
      set({ favorites: data });
    } catch (e) { console.error(e); }
  },

  toggleFavorite: async (driverId: string) => {
    const exists = get().favorites.some(f => f.id === driverId);
    try {
      if (exists) {
        await api.favorites.remove(driverId);
        set({ favorites: get().favorites.filter(f => f.id !== driverId) });
      } else {
        await api.favorites.add(driverId);
        await get().fetchFavorites();
      }
    } catch (e) { console.error(e); }
  },

  fetchDownloads: async () => {
    try {
      const data = await api.downloads.list() as DownloadRecord[];
      set({ downloads: data });
    } catch (e) { console.error(e); }
  },

  startDownload: async (driver: Driver, mirrorId: string) => {
    try {
      const record = await api.downloads.create({
        driverId: driver.id,
        driverName: driver.gpuNames?.[0] ? `${driver.gpuNames[0]} ${driver.version}` : driver.version,
        version: driver.version,
        mirrorId,
        size: driver.fileSize,
      }) as DownloadRecord;
      set({ downloads: [record, ...get().downloads] });
      // 模拟下载进度
      const simulate = () => {
        const current = get().downloads.find(d => d.id === record.id);
        if (!current || current.status !== 'downloading') return;
        const nextProgress = Math.min(current.progress + Math.random() * 12 + 5, 100);
        if (nextProgress >= 100) {
          get().updateDownloadProgress(record.id, 100, 'completed');
        } else {
          get().updateDownloadProgress(record.id, Math.round(nextProgress));
          setTimeout(simulate, 1200);
        }
      };
      setTimeout(simulate, 1000);
    } catch (e) { console.error(e); }
  },

  updateDownloadProgress: async (id: string, progress: number, status?: DownloadRecord['status']) => {
    try {
      const updated = await api.downloads.update(id, {
        progress,
        ...(status ? { status } : {}),
      }) as DownloadRecord;
      set({
        downloads: get().downloads.map(d => (d.id === id ? updated : d)),
      });
    } catch (e) { console.error(e); }
  },

  toggleDriverSelection: (driverId: string) => {
    const list = get().selectedDriverIds;
    if (list.includes(driverId)) {
      set({ selectedDriverIds: list.filter(id => id !== driverId) });
    } else {
      set({ selectedDriverIds: [...list, driverId] });
    }
  },

  clearSelection: () => set({ selectedDriverIds: [] }),

  batchSelect: (ids: string[]) => set({ selectedDriverIds: ids }),
}));
