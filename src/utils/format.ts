export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDownloadCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function truncateHash(hash: string, start = 8, end = 8): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function brandColor(brand: string): string {
  switch (brand) {
    case 'nvidia': return '#76B900';
    case 'amd': return '#ED1C24';
    case 'intel': return '#0071C5';
    default: return '#00F0FF';
  }
}

export function getBrandName(brand: string): string {
  switch (brand) {
    case 'nvidia': return 'NVIDIA';
    case 'amd': return 'AMD';
    case 'intel': return 'Intel';
    default: return brand;
  }
}

export function cn(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
