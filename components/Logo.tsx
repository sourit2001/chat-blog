import React from 'react';

export const Logo = ({ className = "w-8 h-8", showText = true }: { className?: string; showText?: boolean }) => (
  <div className="flex items-center gap-2 select-none">
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Main Chat Bubble Shape merging into a document */}
        <path
          d="M44 24C44 35.0457 35.0457 44 24 44C19.27 44 14.92 42.36 11.5 39.5L4 44L6.5 35.5C2.5 32.3 0 28.4 0 24C0 12.9543 8.9543 4 20 4H28C36.8366 4 44 11.1634 44 20V24Z"
          fill="url(#paint0_linear)"
        />
        
        {/* Document Lines inside */}
        <rect x="12" y="16" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.9" />
        <rect x="12" y="24" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.9" />
        <rect x="12" y="32" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.9" />

        {/* Pen tip hint (optional, maybe too complex for small size) */}
        
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="0"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#34D399" /> {/* emerald-400 */}
            <stop offset="1" stopColor="#059669" /> {/* emerald-600 */}
          </linearGradient>
        </defs>
      </svg>
    </div>
    {showText && (
      <div className="flex flex-col leading-none">
        <span className="font-bold text-lg tracking-tight text-emerald-950">
          Chat<span className="text-emerald-500">2</span>Blog
        </span>
      </div>
    )}
  </div>
);
