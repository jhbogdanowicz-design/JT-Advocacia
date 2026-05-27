import React from 'react';

export default function Logo({ className = '', width = 120, height = 100 }) {
  return (
    <div 
      className={`logo-container ${className}`} 
      style={{ 
        width, 
        height, 
        display: 'inline-flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        userSelect: 'none'
      }}
    >
      <svg 
        viewBox="0 0 120 100" 
        width="100%" 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            .logo-text-j {
              font-family: 'Cinzel', 'Playfair Display', 'Georgia', serif;
              font-size: 88px;
              font-weight: 700;
              fill: var(--color-gold);
              transition: fill 0.4s ease;
            }
            .logo-text-t {
              font-family: 'Cinzel', 'Playfair Display', 'Georgia', serif;
              font-size: 88px;
              font-weight: 700;
              fill: var(--color-text-primary);
              transition: fill 0.4s ease;
            }
          `}
        </style>
        <g>
          {/* Overlapping 'J' and 'T' matching your serif monogram */}
          <text x="22" y="82" className="logo-text-j">J</text>
          <text x="54" y="82" className="logo-text-t">T</text>
        </g>
      </svg>
    </div>
  );
}
