export type Brand = 'nvidia' | 'amd' | 'intel';

export interface GpuModel {
  id: string;
  brand: Brand;
  series: string;
  name: string;
  codename?: string;
  memory?: string;
  interface?: string;
  releaseDate: string;
  driverCount: number;
  image?: string;
}

export interface MirrorSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  speed?: number;
}

export interface Driver {
  id: string;
  gpuIds: string[];
  gpuNames?: string[];
  version: string;
  isWHQL: boolean;
  releaseDate: string;
  fileSize: string;
  osSupport: string[];
  md5: string;
  sha256: string;
  changelog: string[];
  mirrors: MirrorSource[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  status: 'approved' | 'pending' | 'rejected';
  submitter?: string;
  submitReason?: string;
}

export type DownloadStatus = 'completed' | 'downloading' | 'failed' | 'canceled';

export interface DownloadRecord {
  id: string;
  driverId: string;
  driverName: string;
  version: string;
  mirrorId: string;
  status: DownloadStatus;
  progress: number;
  size: string;
  startTime: string;
  completedTime?: string;
}

export type FeedbackType = 'broken_link' | 'install_issue' | 'performance' | 'compatibility' | 'other';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved';

export interface Feedback {
  id: string;
  type: FeedbackType;
  driverId?: string;
  driverName?: string;
  mirrorId?: string;
  mirrorName?: string;
  content: string;
  rating?: number;
  contact?: string;
  status: FeedbackStatus;
  createdAt: string;
  reply?: string;
}

export interface CompatibilityInfo {
  series: string;
  brand: Brand;
  win10: boolean;
  win11: boolean;
  win7: boolean;
  win8: boolean;
  notes?: string;
}

export interface BsodIssue {
  code: string;
  title: string;
  description: string;
  solution: string[];
  relatedDrivers?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'success';
}
