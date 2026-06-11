import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  MonitorCog,
  Info,
  GitCompare,
  Download,
  ShieldCheck,
  MessageSquare,
  Settings,
  Cpu,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/gpus', label: '显卡型号库', icon: MonitorCog },
  { to: '/compare', label: '版本对比', icon: GitCompare },
  { to: '/downloads', label: '下载记录', icon: Download },
  { to: '/compatibility', label: '兼容性指南', icon: ShieldCheck },
  { to: '/feedback', label: '问题反馈', icon: MessageSquare },
  { to: '/admin', label: '管理员', icon: Settings },
];

export default function Layout() {
  const downloads = useAppStore((s) => s.downloads);
  const downloadingCount = downloads.filter((d) => d.status === 'downloading').length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-bg-900/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-cyan-dim flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-bg-900" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-wider">
              GPU<span className="text-neon-cyan">HUB</span>
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn('nav-link flex items-center gap-1.5', isActive && 'active')
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <NavLink to="/downloads" className="relative">
            <button className="btn-ghost !px-3 !py-2">
              <Download className="w-5 h-5" />
              {downloadingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-cyan text-bg-900 text-xs font-bold rounded-full flex items-center justify-center shadow-glow-cyan animate-pulse">
                  {downloadingCount > 9 ? '9+' : downloadingCount}
                </span>
              )}
            </button>
          </NavLink>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 bg-bg-900/50 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-cyan-dim flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-bg-900" />
                </div>
                <span className="font-display font-bold text-white">
                  GPU<span className="text-neon-cyan">HUB</span>
                </span>
              </div>
              <p className="text-sm text-slate-400">
                专为装机用户和电脑维修店提供快速、可靠的显卡驱动查找与下载服务。
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {navItems.slice(0, 4).map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className="hover:text-neon-cyan transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {navItems.slice(4).map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className="hover:text-neon-cyan transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 GPUHUB. WHQL 是 Microsoft Corporation 的商标。
            </p>
            <p className="text-xs text-slate-500">
              <span className="text-neon-cyan">v1.0.0</span> · Powered by Neon Tech
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
