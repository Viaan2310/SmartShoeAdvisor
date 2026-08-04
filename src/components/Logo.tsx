import { Footprints, ScanLine } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const dimensions = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-20 w-20' };
  const textSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  const iconSize = { sm: 18, md: 22, lg: 34 };

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        {/* Glow */}
        <div className={`absolute inset-0 ${dimensions[size]} bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
        {/* Icon container */}
        <div className={`relative ${dimensions[size]} rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30 bg-gradient-to-br from-sky-500 via-blue-600 to-blue-700 flex items-center justify-center`}>
          {/* Inner ring */}
          <div className="absolute inset-[2px] rounded-[14px] border border-white/15" />
          {/* Footprint icon */}
          <Footprints size={iconSize[size]} className="relative text-white drop-shadow-sm" strokeWidth={2.2} />
          {/* Scan line accent */}
          <div className="absolute left-1 right-1 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-80" />
          {/* AI spark */}
          <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]" />
        </div>
      </div>
      {size !== 'sm' && (
        <div className="flex flex-col leading-tight">
          <span className={`${textSize[size]} font-bold gradient-text`}>Smart Shoe Advisor</span>
          {size === 'lg' && (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <ScanLine size={12} className="text-cyan-500" />
              AI Foot Analysis
            </span>
          )}
        </div>
      )}
    </div>
  );
}
