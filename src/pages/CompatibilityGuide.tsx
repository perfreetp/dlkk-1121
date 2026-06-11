import { useState, useEffect } from 'react';
import {
  Monitor, ShieldAlert, Bug, Search, ChevronDown, ChevronUp,
  Trash2, WifiOff, Database, Zap, UserCog, ShieldCheck, RotateCcw, CheckCircle, XCircle,
  ExternalLink, Info
} from 'lucide-react';
import { api } from '@/utils/api';
import { brandColor, getBrandName, cn } from '@/utils/format';
import type { CompatibilityInfo, BsodIssue } from '@/types';

type TabKey = 'compatibility' | 'install' | 'bsod';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'compatibility', label: '系统兼容', icon: Monitor },
  { key: 'install', label: '安装须知', icon: ShieldAlert },
  { key: 'bsod', label: '蓝屏问题', icon: Bug },
];

const WINDOWS_VERSIONS = [
  { key: 'win7', label: 'Win7' },
  { key: 'win8', label: 'Win8' },
  { key: 'win10', label: 'Win10' },
  { key: 'win11', label: 'Win11' },
] as const;

const INSTALL_STEPS = [
  { icon: Trash2, title: '卸载旧驱动(DDU)', desc: '使用 Display Driver Uninstaller 在安全模式下彻底清理旧驱动文件和注册表' },
  { icon: ShieldCheck, title: '关闭杀毒软件', desc: '临时关闭 Windows Defender 及第三方杀毒，避免驱动安装时文件被拦截' },
  { icon: WifiOff, title: '断开网络连接', desc: '防止 Windows Update 在安装过程中自动下载并覆盖兼容驱动' },
  { icon: Database, title: '备份重要数据', desc: '驱动安装可能导致重启，建议备份工作文档和系统还原点' },
  { icon: Zap, title: '检查电源供电', desc: '确认显卡供电线已插紧，电源功率满足显卡 TDP 需求' },
  { icon: UserCog, title: '管理员权限运行', desc: '右键安装程序，选择「以管理员身份运行」确保写入权限' },
  { icon: ShieldAlert, title: '安全模式安装', desc: '如遇安装失败，尝试进入安全模式后运行驱动安装程序' },
  { icon: RotateCcw, title: '重启验证', desc: '安装完成后必须重启，检查设备管理器中显卡是否正常识别' },
];

export default function CompatibilityGuide() {
  const [activeTab, setActiveTab] = useState<TabKey>('compatibility');
  const [compatibility, setCompatibility] = useState<CompatibilityInfo[]>([]);
  const [bsodIssues, setBsodIssues] = useState<BsodIssue[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [expandedBsod, setExpandedBsod] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    api.misc.compatibility().then(data => setCompatibility(data as CompatibilityInfo[]));
    api.misc.bsod().then(data => setBsodIssues(data as BsodIssue[]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.misc.bsod(searchCode).then(data => setBsodIssues(data as BsodIssue[]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCode]);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-info" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">兼容性指南</h1>
            <p className="text-sm text-slate-400">驱动安装前后的常见问题与解决方案</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all -mb-px border-b-2',
                  activeTab === tab.key
                    ? 'text-neon-cyan border-neon-cyan'
                    : 'text-slate-400 border-transparent hover:text-white hover:border-white/20'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'compatibility' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-700/50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-300">显卡系列</th>
                    {WINDOWS_VERSIONS.map(v => (
                      <th key={v.key} className="text-center px-6 py-4 font-semibold text-slate-300">
                        {v.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compatibility.map(row => (
                    <tr key={row.series} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: brandColor(row.brand) }}
                          />
                          <span className="font-medium text-white">{row.series}</span>
                          <span className="text-xs text-slate-500">{getBrandName(row.brand)}</span>
                        </div>
                      </td>
                      {WINDOWS_VERSIONS.map(v => {
                        const supported = row[v.key];
                        const cellKey = `${row.series}-${v.key}`;
                        return (
                          <td key={v.key} className="text-center px-6 py-4 relative">
                            <div
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-help"
                              onMouseEnter={() => setHoveredCell(cellKey)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              {supported ? (
                                <CheckCircle className="w-5 h-5 text-whql" />
                              ) : (
                                <XCircle className="w-5 h-5 text-danger" />
                              )}
                            </div>
                            {hoveredCell === cellKey && row.notes && (
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 w-64 p-3 bg-bg-700 border border-white/10 rounded-lg shadow-card text-sm text-slate-300">
                                <div className="flex items-start gap-2">
                                  <Info className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                                  <span>{row.notes}</span>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'install' && (
          <div className="grid md:grid-cols-2 gap-4">
            {INSTALL_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="card p-5 card-hover">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-neon-cyan" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-cyan text-bg-900 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'bsod' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                placeholder="搜索蓝屏代码，如 0x00000116、VIDEO_TDR_FAILURE..."
                className="input-base pl-12"
              />
            </div>

            <div className="space-y-3">
              {bsodIssues.length === 0 ? (
                <div className="card p-12 text-center">
                  <Bug className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400">未找到匹配的蓝屏问题</p>
                </div>
              ) : (
                bsodIssues.map(issue => {
                  const isExpanded = expandedBsod === issue.code;
                  return (
                    <div key={issue.code} className="card overflow-hidden">
                      <button
                        onClick={() => setExpandedBsod(isExpanded ? null : issue.code)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center flex-shrink-0">
                            <Bug className="w-5 h-5 text-danger" />
                          </div>
                          <div>
                            <p className="font-mono text-sm text-danger mb-1">{issue.code}</p>
                            <h3 className="font-semibold text-white">{issue.title}</h3>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium text-slate-300 mb-2">问题描述</p>
                            <p className="text-sm text-slate-400 leading-relaxed">{issue.description}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-300 mb-2">解决方案</p>
                            <ol className="space-y-2">
                              {issue.solution.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/15 text-neon-cyan text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="pt-0.5">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          {issue.relatedDrivers && issue.relatedDrivers.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-slate-300 mb-2">相关驱动</p>
                              <div className="flex flex-wrap gap-2">
                                {issue.relatedDrivers.map(drvId => (
                                  <button
                                    key={drvId}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-700 text-sm text-slate-300 hover:bg-bg-600 hover:text-neon-cyan transition-colors"
                                  >
                                    <span className="font-mono text-xs">{drvId}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
