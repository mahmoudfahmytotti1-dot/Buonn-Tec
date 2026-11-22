import React from 'react';

interface BrandLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
}) => {
  const iconSizeClass =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textClass =
    size === 'sm'
      ? 'text-lg font-black'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl font-black'
      : 'text-xl sm:text-2xl font-black';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizeClass} shrink-0`}
        aria-hidden="true"
      >
        {/* Outer rounded coffee-exchange crest */}
        <rect
          x="2"
          y="2"
          width="40"
          height="40"
          rx="12"
          fill={variant === 'light' ? '#2A1A11' : '#1C110B'}
          stroke="#C89B3C"
          strokeWidth="1.75"
        />
        {/* Botanical green coffee leaf accent */}
        <path
          d="M27.5 9.5C31.5 9.5 34.5 12 34.5 15.8C30.5 16 27.2 13.6 27.5 9.5Z"
          fill="#229944"
        />
        {/* Stylized tilted coffee bean */}
        <g transform="rotate(-24 22 23)">
          <ellipse cx="22" cy="23" rx="9.5" ry="12.5" fill="#C89B3C" />
          <path
            d="M22 11.2C19.5 16.5 24.5 23 22 34.8"
            stroke="#1C110B"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </g>
        {/* Copper-terracotta exchange highlight arc */}
        <path
          d="M11 31.5C13.5 35.5 18 37.5 23.5 37.2"
          stroke="#D46A3E"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Digital trade node */}
        <circle cx="12.5" cy="12.5" r="2.1" fill="#F2C864" />
      </svg>

      <span
        className={`${textClass} tracking-tight ${
          variant === 'light' ? 'text-white' : 'text-[#1C110B]'
        }`}
      >
        بُنّ <span className="text-[#B4532A]">تك</span>
      </span>
    </span>
  );
};
