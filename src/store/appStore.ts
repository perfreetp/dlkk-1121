import { create } from 'zustand';
import type { Driver, DownloadRecord } from '@/types';
import { api } from '@/utils/api';

const DEFAULT_INSTALL_NOTES = [
  '安装前请关闭杀毒软件，避免误拦截驱动签名文件',
  '建议先卸载旧版本驱动（DDU清理更彻底），再安装新版本',
  '安装过程中屏幕可能会闪烁数次，属于正常现象',
  '安装完成后需重启电脑，驱动才能完全生效',
  '如遇蓝屏问题，可进入安全模式回滚或重装上一版驱动',
];

interface AppState {
  favorites: Driver[];
  downloads: DownloadRecord[];
  selectedDriverIds: string[];
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (driverId: string) => Promise<void>;
  fetchDownloads: () => Promise<void>;
  enrichDownloads: () => Promise<void>;
  startDownload: (driver: Driver, optionId: string) => Promise<void>;
  batchStartDownload: (gpuIds: string[]) => Promise<number>;
  updateDownloadProgress: (id: string, progress: number, status?: DownloadRecord['status']) => Promise<void>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  verifyDownload: (id: string) => void;
  moveDownloadTop: (id: string) => void;
  moveDownloadBottom: (id: string) => void;
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

  enrichDownloads: async () => {
    try {
      const current = get().downloads;
      const needsEnrich = current.filter(d =>
        !d.mirrorName || !d.gpuNames || !d.md5 || !d.installNotes
      );
      if (needsEnrich.length === 0) return;
      const allDrivers = await api.drivers.list({ status: 'approved' }) as Driver[];
      let changed = false;
      const updated = current.map(d => {
        if (d.mirrorName && d.gpuNames && d.md5 && d.installNotes) return d;
        const driver = allDrivers.find(function(dr) { return dr.id === d.driverId; });
        if (!driver) return d;
        changed = true;
        const mirror = driver.mirrors.find(function(m) { return m.id === d.mirrorId; });
        const patch: any = {};
        if (!d.mirrorName && mirror) patch.mirrorName = mirror.name;
        if (!d.mirrorUrl && mirror) patch.mirrorUrl = mirror.url;
        if (!d.gpuNames && driver.gpuNames) patch.gpuNames = driver.gpuNames;
        if (!d.md5) patch.md5 = driver.md5;
        if (!d.sha256) patch.sha256 = driver.sha256;
        if (!d.osSupport) patch.osSupport = driver.osSupport;
        if (!d.installNotes) patch.installNotes = DEFAULT_INSTALL_NOTES;
        const merged = { ...d, ...patch };
        api.downloads.update(d.id, patch).catch(function() {});
        return merged;
      });
      if (changed) set({ downloads: updated });
    } catch (e) { console.error(e); }
  },

  startDownload: async (driver: Driver, optionId: string) => {
    try {
      let mirrorId = optionId;
      let backupIndex: number | undefined;
      const bkMatch = optionId.match(/^(.+)-bk-(\d+)$/);
      if (bkMatch) {
        mirrorId = bkMatch[1];
        backupIndex = parseInt(bkMatch[2], 10);
      }
      const mirror = driver.mirrors.find(function(m) { return m.id === mirrorId; });
      const isBackup = backupIndex !== undefined;
      const backupUrl = isBackup && mirror?.backupUrls ? mirror.backupUrls[backupIndex!] : null;
      const mirrorName = isBackup && backupUrl
        ? `${mirror?.name} · ${backupUrl.label === 'primary' ? '主用备用' : '备用线路'}`
        : mirror?.name;
      const mirrorUrl = isBackup && backupUrl ? backupUrl.url : mirror?.url;
      const mirrorLabel = isBackup ? 'backup' : (mirror?.name && (mirror.name.toLowerCase().includes('官网') || mirror.name.toLowerCase().includes('官方') || mirror.name.toLowerCase().includes('nvidia') || mirror.name.toLowerCase().includes('amd') || mirror.name.toLowerCase().includes('intel')) ? 'official' : 'mirror');

      const record = await api.downloads.create({
        driverId: driver.id,
        driverName: driver.gpuNames?.[0] ? `${driver.gpuNames[0]} ${driver.version}` : driver.version,
        version: driver.version,
        mirrorId,
        mirrorName,
        mirrorUrl,
        mirrorLabel,
        gpuNames: driver.gpuNames,
        md5: driver.md5,
        sha256: driver.sha256,
        installNotes: DEFAULT_INSTALL_NOTES,
        osSupport: driver.osSupport,
        size: driver.fileSize,
        verifyStatus: 'pending',
      }) as DownloadRecord;
      set({ downloads: [record, ...get().downloads] });
      const simulate = function(id: string, baseProgress: number) {
        const current = get().downloads.find(function(d) { return d.id === id; });
        if (!current || current.status !== 'downloading') return;
        const nextProgress = Math.min(baseProgress + Math.random() * 12 + 5, 100);
        if (nextProgress >= 100) {
          get().updateDownloadProgress(id, 100, 'completed');
          get().verifyDownload(id);
        } else {
          const rounded = Math.round(nextProgress);
          get().updateDownloadProgress(id, rounded);
          setTimeout(function() { simulate(id, rounded); }, 1200);
        }
      };
      setTimeout(function() { simulate(record.id, 0); }, 1000);
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

  pauseDownload: async (id: string) => {
    try {
      const current = get().downloads.find(function(d) { return d.id === id; });
      if (!current) return;
      const updated = await api.downloads.update(id, {
        status: 'paused',
        pausedTime: new Date().toISOString(),
        pausedProgress: current.progress,
      }) as DownloadRecord;
      const nextList = get().downloads.map(function(d) { return d.id === id ? updated : d; });
      set({ downloads: nextList });
    } catch (e) { console.error(e); }
  },

  resumeDownload: async (id: string) => {
    try {
      const current = get().downloads.find(function(d) { return d.id === id; });
      if (!current) return;
      const baseProgress = current.pausedProgress != null ? current.pausedProgress : current.progress;
      const updated = await api.downloads.update(id, {
        status: 'downloading',
        progress: baseProgress,
      }) as DownloadRecord;
      const nextList = get().downloads.map(function(d) { return d.id === id ? updated : d; });
      set({ downloads: nextList });
      const simulate = (rid: string, base: number) => {
        const cur = get().downloads.find(d => d.id === rid);
        if (!cur || cur.status !== 'downloading') return;
        const nextProgress = Math.min(base + Math.random() * 12 + 5, 100);
        if (nextProgress >= 100) {
          get().updateDownloadProgress(rid, 100, 'completed');
        } else {
          const rounded = Math.round(nextProgress);
          get().updateDownloadProgress(rid, rounded);
          setTimeout(() => simulate(rid, rounded), 1200);
        }
      };
      setTimeout(() => simulate(id, baseProgress), 1000);
    } catch (e) { console.error(e); }
  },

  cancelDownload: async (id: string) => {
    try {
      const current = get().downloads.find(function(d) { return d.id === id; });
      if (!current) return;
      const updated = await api.downloads.update(id, {
        status: 'canceled',
      }) as DownloadRecord;
      const nextList = get().downloads.map(function(d) { return d.id === id ? updated : d; });
      set({ downloads: nextList });
    } catch (e) { console.error(e); }
  },

  retryDownload: async (id: string) => {
    try {
      const current = get().downloads.find(function(d) { return d.id === id; });
      if (!current) return;
      const drivers = await api.drivers.list({ status: 'approved' }) as Driver[];
      const driver = drivers.find(function(d) { return d.id === current.driverId; });
      if (!driver) return;
      const mirror = driver.mirrors.find(function(m) { return m.id === current.mirrorId; }) || driver.mirrors.find(function(m) { return m.enabled; });
      if (!mirror) return;
      const updated = await api.downloads.update(id, {
        status: 'downloading',
        progress: 0,
        verifyStatus: 'pending',
        verifyError: undefined,
      }) as DownloadRecord;
      const nextList = get().downloads.map(function(d) { return d.id === id ? updated : d; });
      set({ downloads: nextList });
      const simulate = function(rid: string, base: number) {
        const cur = get().downloads.find(function(d) { return d.id === rid; });
        if (!cur || cur.status !== 'downloading') return;
        const nextProgress = Math.min(base + Math.random() * 12 + 5, 100);
        if (nextProgress >= 100) {
          get().updateDownloadProgress(rid, 100, 'completed');
          get().verifyDownload(rid);
        } else {
          const rounded = Math.round(nextProgress);
          get().updateDownloadProgress(rid, rounded);
          setTimeout(function() { simulate(rid, rounded); }, 1200);
        }
      };
      setTimeout(function() { simulate(id, 0); }, 1000);
    } catch (e) { console.error(e); }
  },

  verifyDownload: (id: string) => {
    const current = get().downloads.find(function(d) { return d.id === id; });
    if (!current || current.status !== 'completed') return;
    const updateLocal = function(patch: Partial<DownloadRecord>) {
      const nextList = get().downloads.map(function(d) { return d.id === id ? { ...d, ...patch } : d; });
      set({ downloads: nextList });
    };
    updateLocal({ verifyStatus: 'verifying' });
    api.downloads.update(id, { verifyStatus: 'verifying' }).catch(function() {});
    setTimeout(function() {
      const cur = get().downloads.find(function(d) { return d.id === id; });
      if (!cur) return;
      const md5Match = cur.md5 && Math.random() > 0.1;
      const sha256Match = cur.sha256 && Math.random() > 0.12;
      const passed = md5Match && sha256Match;
      const errors: string[] = [];
      if (!md5Match) errors.push('MD5 校验不匹配');
      if (!sha256Match) errors.push('SHA256 校验不匹配');
      const result: Partial<DownloadRecord> = {
        verifyStatus: passed ? 'passed' : 'failed',
        verifyError: passed ? undefined : errors.join('、'),
      };
      updateLocal(result);
      api.downloads.update(id, result).catch(function() {});
    }, 1500);
  },

  moveDownloadTop: (id: string) => {
    const list = get().downloads;
    const active = list.filter(function(d) { return d.status !== 'completed'; });
    const others = list.filter(function(d) { return d.status === 'completed'; });
    const idx = active.findIndex(function(d) { return d.id === id; });
    if (idx <= 0) return;
    const item = active[idx];
    const nextActive = active.filter(function(d) { return d.id !== id; });
    nextActive.unshift(item);
    const next = [...nextActive, ...others];
    set({ downloads: next });
    const ids = nextActive.map(function(d) { return d.id; });
    api.downloads.reorder(ids).catch(function() {});
  },

  moveDownloadBottom: (id: string) => {
    const list = get().downloads;
    const active = list.filter(function(d) { return d.status !== 'completed'; });
    const others = list.filter(function(d) { return d.status === 'completed'; });
    const idx = active.findIndex(function(d) { return d.id === id; });
    if (idx < 0 || idx === active.length - 1) return;
    const item = active[idx];
    const nextActive = active.filter(function(d) { return d.id !== id; });
    nextActive.push(item);
    const next = [...nextActive, ...others];
    set({ downloads: next });
    const ids = nextActive.map(function(d) { return d.id; });
    api.downloads.reorder(ids).catch(function() {});
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

  batchStartDownload: async (gpuIds: string[]): Promise<number> => {
    let addedCount = 0;
    try {
      const allDrivers = await api.drivers.list({ status: 'approved' }) as Driver[];
      for (const gpuId of gpuIds) {
        const driversForGpu = allDrivers.filter(d => d.gpuIds.includes(gpuId) && d.status === 'approved');
        if (driversForGpu.length === 0) continue;
        const latestDriver = driversForGpu.sort((a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        )[0];
        const enabledMirror = latestDriver.mirrors.find(m => m.enabled);
        if (!enabledMirror) continue;
        const existing = get().downloads.find(d => d.driverId === latestDriver.id && d.status !== 'failed');
        if (existing) continue;
        await get().startDownload(latestDriver, enabledMirror.id);
        addedCount++;
      }
    } catch (e) { console.error(e); }
    return addedCount;
  },
}));
