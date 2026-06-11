import { useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
};

export default function SearchBar({
  onSearch,
  placeholder = '搜索...',
  size = 'md',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query.trim());
    }
  };

  const handleSearchClick = () => {
    onSearch(query.trim());
  };

  return (
    <div
      className={cn(
        'relative flex items-center w-full rounded-lg bg-bg-700 border transition-all duration-300',
        focused
          ? 'border-neon-cyan/50 shadow-glow-cyan'
          : 'border-white/10 hover:border-white/20',
        sizeMap[size]
      )}
    >
      <Search
        className={cn(
          'mr-2 flex-shrink-0 transition-colors',
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5',
          focused || query ? 'text-neon-cyan' : 'text-slate-500'
        )}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={handleSearchClick}
          className="ml-2 flex-shrink-0 text-neon-cyan hover:text-neon-cyan-dim transition-colors font-medium"
        >
          搜索
        </button>
      )}
    </div>
  );
}
