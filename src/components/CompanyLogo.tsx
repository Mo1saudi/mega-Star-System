import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const dim = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Vector Logo matching uploaded MegaStar Tours emblem */}
      <div className={`${dim} shrink-0 relative rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 shadow-md shadow-amber-500/20 flex items-center justify-center`}>
        <div className="w-full h-full bg-white dark:bg-[#0f172a] rounded-full p-1 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Gold outer circle */}
            <circle cx="100" cy="100" r="94" stroke="url(#goldGrad)" strokeWidth="4" />
            
            {/* Outer Location Pin Outline (Gold Arch) */}
            <path 
              d="M100 22 C62 22 36 50 36 86 C36 112 70 138 92 144 C96 145 104 145 108 144 C130 138 164 112 164 86 C164 50 138 22 100 22 Z" 
              fill="none" 
              stroke="url(#goldGrad)" 
              strokeWidth="10" 
              strokeLinecap="round"
            />

            {/* Stylized Kaaba in Center */}
            <g transform="translate(62, 54)">
              {/* Kaaba Top Roof */}
              <polygon points="38,2 74,16 38,28 2,16" fill="url(#goldGrad)" />
              {/* Kaaba Gold Band */}
              <polygon points="2,16 38,28 38,34 2,22" fill="#d97706" />
              <polygon points="38,28 74,16 74,22 38,34" fill="#b45309" />
              {/* Kaaba Body Left */}
              <polygon points="2,22 38,34 38,62 2,48" fill="#451a03" />
              {/* Kaaba Body Right */}
              <polygon points="38,34 74,22 74,48 38,62" fill="#290f03" />
              {/* Door Highlight */}
              <rect x="46" y="38" width="10" height="18" fill="url(#goldGrad)" rx="1" />
            </g>

            {/* Arabic Typography: ميجا (MEGA) */}
            <text 
              x="100" 
              y="166" 
              textAnchor="middle" 
              fill="#1e1b18" 
              className="dark:fill-white"
              fontWeight="900" 
              fontSize="34" 
              fontFamily="Cairo, sans-serif"
            >
              ميجا
            </text>

            {/* Arabic Subtitle: ستار تورز (STAR TOURS) */}
            <text 
              x="100" 
              y="185" 
              textAnchor="middle" 
              fill="#b45309" 
              fontWeight="800" 
              fontSize="14" 
              letterSpacing="2"
              fontFamily="Cairo, sans-serif"
            >
              ستار تورز
            </text>

            {/* Gradients */}
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Optional Brand Text beside Logo */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-black text-slate-900 dark:text-white font-cairo leading-none tracking-tight">
            ميجا ستار <span className="text-amber-500 font-extrabold text-xs">تورز</span>
          </span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-cairo mt-0.5">
            إدارة خدمات العمرة والسياحة ERP
          </span>
        </div>
      )}
    </div>
  );
};
