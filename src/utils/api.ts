const BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  gpus: {
    list: (params: Record<string, any> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/gpus${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request(`/gpus/${id}`),
    series: () => request('/gpus/series'),
  },
  drivers: {
    list: (params: Record<string, any> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/drivers${q ? `?${q}` : ''}`);
    },
    byGpu: (gpuId: string) => request(`/drivers/gpu/${gpuId}`),
    get: (id: string) => request(`/drivers/${id}`),
    popular: () => request('/drivers/popular'),
    latest: () => request('/drivers/latest'),
    create: (data: any) => request('/drivers', { method: 'POST', body: JSON.stringify(data) }),
    rate: (id: string, rating: number) =>
      request(`/drivers/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  },
  downloads: {
    list: () => request('/downloads'),
    create: (data: any) => request('/downloads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/downloads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/downloads/${id}`, { method: 'DELETE' }),
  },
  feedback: {
    list: () => request('/feedback'),
    create: (data: any) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request(`/feedback/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  admin: {
    pendingDrivers: () => request('/admin/pending-drivers'),
    stats: () => request('/admin/stats'),
    approve: (id: string) => request(`/admin/drivers/${id}/approve`, { method: 'POST' }),
    reject: (id: string) => request(`/admin/drivers/${id}/reject`, { method: 'POST' }),
    toggleMirror: (driverId: string, mirrorId: string, enabled: boolean) =>
      request('/admin/mirrors/toggle', {
        method: 'POST',
        body: JSON.stringify({ driverId, mirrorId, enabled }),
      }),
    updateMirror: (driverId: string, mirrorId: string, data: { name?: string; url?: string; speed?: number | null; backupUrls?: string[] }) =>
      request('/admin/mirrors/update', {
        method: 'POST',
        body: JSON.stringify({ driverId, mirrorId, ...data }),
      }),
    addMirror: (driverId: string, data: { name: string; url: string; speed?: number; backupUrls?: string[] }) =>
      request('/admin/mirrors/add', {
        method: 'POST',
        body: JSON.stringify({ driverId, ...data }),
      }),
  },
  favorites: {
    list: () => request('/favorites'),
    add: (driverId: string) => request(`/favorites/${driverId}`, { method: 'POST' }),
    remove: (driverId: string) => request(`/favorites/${driverId}`, { method: 'DELETE' }),
  },
  misc: {
    compatibility: () => request('/misc/compatibility'),
    bsod: (code?: string) => request(`/misc/bsod${code ? `?code=${code}` : ''}`),
    announcements: () => request('/misc/announcements'),
  },
};
