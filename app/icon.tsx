import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="0"
              y1="4"
              x2="44"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#34D399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
          <path
            d="M44 24C44 35.0457 35.0457 44 24 44C19.27 44 14.92 42.36 11.5 39.5L4 44L6.5 35.5C2.5 32.3 0 28.4 0 24C0 12.9543 8.9543 4 20 4H28C36.8366 4 44 11.1634 44 20V24Z"
            fill="url(#paint0_linear)"
          />
          <rect x="12" y="16" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.9" />
          <rect x="12" y="24" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.9" />
          <rect x="12" y="32" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
