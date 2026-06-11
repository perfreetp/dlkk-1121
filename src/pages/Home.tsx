import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Cpu,
  TrendingUp,
  Clock,
  Megaphone,
  ShieldCheck,
  Download,
  Star,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { Driver, Announcement } from '@/types';
import { BRAND_OPTIONS } from '@/types';
import { api } from '@/utils/api';
import { formatDate, formatDownloadCount, cn } from '@/utils/format';
import DriverCard from '@/components/DriverCard';
import Badge from '@/components/Badge';

const SUGGESTIONS = [
  'RTX 4090',
  'RTX 4080 SUPER',
  'RTX 4070 Ti',
  'RTX 3090',
  'RTX 3080',
  'RTX 3060',
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularDrivers, setPopularDrivers] = useState<Driver[]>([]);
  const [latestDrivers, setLatestDrivers] = useState<Driver[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    api.drivers.popular().then((d) => setPopularDrivers((d as Driver[]).slice(0, 6)));
    api.drivers.latest().then((d) => setLatestDrivers((d as Driver[]).slice(0, 5)));
    api.misc.announcements().then((a) => setAnnouncements((a as Announcement[]).slice(0, 3)));
  }, []);

  const filteredSuggestions = query
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSearch = (q: string) => {
    navigate(`/gpus?search=${encodeURIComponent(q)}`);
  };

  const handleBrandClick = (brand: string) => {
    navigate(`/gpus?brand=${brand}`);
  };

  const announcementIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const announcementVariant = (type: Announcement['type']): 'info' | 'warn' | 'cyan' => {
    switch (type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warn';
      case 'success':
        return 'cyan';
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="container relative">
          <div
            className="max-w-3xl mx-auto text-center animate-fade-in-up"
            style={{ animationDelay: '0ms' }}
          >
            <h1 className="font-display font-black text-4xl md:text-6xl text-white mb-4 leading-tight">
              快速找到最可靠的
              <span className="text-neon-cyan"> 显卡驱动</span>
            </h1>
            <p className="text-lg text-slate-400 mb-10">
              收录 NVIDIA / AMD / Intel 全系列显卡驱动，WHQL 认证，极速下载
            </p>
            <div className="relative max-w-2xl mx-auto">
              <div
                className={cn(
                  'flex items-center w-full rounded-xl bg-bg-700 border-2 transition-all duration-300 px-4 py-3',
                  showSuggestions || query
                    ? 'border-neon-cyan/50 shadow-glow-cyan'
                    : 'border-white/10 hover:border-white/20'
                )}
              >
                <Search className="w-6 h-6 mr-3 text-neon-cyan" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(query);
                  }}
                  placeholder="搜索显卡型号，如 RTX 4090..."
                  className="flex-1 bg-transparent text-lg text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSearch(query)}
                  className="btn-primary !py-2 !px-6 ml-2"
                >
                  搜索
                </button>
              </div>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-bg-700 border border-neon-cyan/30 rounded-xl overflow-hidden shadow-glow-cyan z-50">
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        handleSearch(s);
                      }}
                      className={cn(
                        'flex items-center w-full px-4 py-3 text-left hover:bg-bg-600 transition-colors',
                        i !== filteredSuggestions.length - 1 && 'border-b border-white/5'
                      )}
                    >
                      <Search className="w-4 h-4 mr-3 text-slate-500" />
                      <span className="text-slate-200">{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mb-20">
        <h2 className="section-title text-center">按品牌浏览</h2>
        <p className="section-subtitle text-center">选择您的显卡品牌</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BRAND_OPTIONS.map((brand, i) => (
            <button
              key={brand.value}
              onClick={() => handleBrandClick(brand.value)}
              className="card card-hover group p-8 text-left animate-fade-in-up"
              style={{
                animationDelay: `${i * 100}ms`,
                boxShadow: `0 0 0 1px ${brand.color}20`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${brand.color}20` }}
              >
                <Cpu className="w-8 h-8" style={{ color: brand.color }} />
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-2 group-hover:text-neon-cyan transition-colors">
                {brand.label}
              </h3>
              <p className="text-slate-400 mb-4">
                {brand.value === 'nvidia' && 'GeForce RTX / GTX 全系列驱动'}
                {brand.value === 'amd' && 'Radeon RX / VEGA 全系列驱动'}
                {brand.value === 'intel' && 'Arc / Iris / UHD 全系列驱动'}
              </p>
              <div
                className="inline-flex items-center text-sm font-medium transition-colors"
                style={{ color: brand.color }}
              >
                浏览全部
                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="container mb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-neon-cyan" />
              热门驱动 TOP 6
            </h2>
            <p className="section-subtitle mb-0">本周下载量最高的驱动版本</p>
          </div>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {popularDrivers.map((driver, i) => (
            <div
              key={driver.id}
              className="w-80 flex-shrink-0 snap-start animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => navigate(`/driver/${driver.id}`)}
            >
              <DriverCard driver={driver} />
            </div>
          ))}
        </div>
      </section>

      <div className="container grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
        <section className="lg:col-span-2">
          <h2 className="section-title flex items-center gap-2">
            <Clock className="w-7 h-7 text-neon-cyan" />
            最新更新
          </h2>
          <p className="section-subtitle">最近发布的驱动版本</p>
          <div className="card divide-y divide-white/5">
            {latestDrivers.map((driver, i) => (
              <button
                key={driver.id}
                onClick={() => navigate(`/driver/${driver.id}`)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-bg-700/50 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-white">v{driver.version}</span>
                    {driver.isWHQL && (
                      <Badge variant="whql">
                        <ShieldCheck className="w-3 h-3" />
                        WHQL
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    适配 {driver.gpuNames?.slice(0, 3).join('、') || driver.gpuIds.length + ' 款显卡'}
                    {driver.gpuNames && driver.gpuNames.length > 3 ? ` 等${driver.gpuNames.length}款` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {driver.rating.toFixed(1)}
                  </div>
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {formatDate(driver.releaseDate)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-neon-cyan" />
            公告栏
          </h2>
          <p className="section-subtitle">重要通知与更新</p>
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <div
                key={a.id}
                className="card p-4 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <Badge variant={announcementVariant(a.type)}>
                    {announcementIcon(a.type)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm mb-1">{a.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-slate-500 mt-2">{formatDate(a.date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
