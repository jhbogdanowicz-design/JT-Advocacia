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
            .logo-text-j, .logo-text-t {
              font-family: 'Cinzel', 'Playfair Display', 'Georgia', serif;
              font-size: 88px;
              font-weight: 700;
              fill: var(--color-gold);
              transition: fill 0.4s ease;
            }
            body.light-theme .logo-text-j, body.light-theme .logo-text-t {
              fill: #002D62; /* Navy blue in light theme */
            }
          `}
        </style>
        <g>
          {/* We render 'T' first, then layer 'J' on top so its vertical stem crosses in front of the 'T', matching your logo! */}
          <text x="46" y="82" className="logo-text-t">T</text>
          <text x="24" y="82" className="logo-text-j">J</text>
        </g>
      </svg>
    </div>
  );
}
