import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  accentColor?: string;
}

export const Logo = ({ className = "w-12 h-8", showText = true, accentColor = "#FB923C" }: LogoProps) => (
  <div className="flex items-center gap-3 select-none group focus:outline-none">
    {/* User's Figma Design Adapted for Component Usage */}
    <div className={`${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform transition-transform duration-500 group-hover:scale-105"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Chat bubble transforming into page (The Lighter Part) */}
        <path
          d="M20 15 Q20 5 30 5 L50 5 Q60 5 60 15 L60 30 Q60 40 50 40 L35 40 L25 50 L25 40 Q20 40 20 30 Z"
          fill={accentColor}
          fillOpacity="0.4"
        />

        {/* The Page/Document Part (The Darker Part) */}
        <path
          d="M50 25 Q50 15 60 15 L90 15 Q100 15 100 25 L100 65 Q100 75 90 75 L60 75 Q50 75 50 65 Z"
          fill={accentColor}
          fillOpacity="1"
        />

        {/* Decorative lines suggesting text in the blog page */}
        <line
          x1="65"
          y1="35"
          x2="85"
          y2="35"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="65"
          y1="45"
          x2="85"
          y2="45"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="65"
          y1="55"
          x2="80"
          y2="55"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>

    {showText && (
      <div className="flex flex-col justify-center">
        <h1 className="text-[#2563EB] font-bold text-lg leading-tight tracking-tight">
          Chat2<span style={{ color: accentColor }}>Blog</span>
        </h1>
        <p className="text-slate-400 text-[9px] font-medium tracking-wide mt-0.5">
          Conversations to Stories
        </p>
      </div>
    )}
  </div>
);
