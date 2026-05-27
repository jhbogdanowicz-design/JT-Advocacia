import React from 'react';
import logoImg from '../assets/logo.png';

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
      <style>
        {`
          .brand-logo-img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            /* Converts your exact navy blue logo to a premium golden color in dark mode */
            filter: invert(72%) sepia(18%) saturate(982%) hue-rotate(346deg) brightness(88%) contrast(85%);
            transition: filter 0.4s ease;
          }
          body.light-theme .brand-logo-img {
            /* Displays your exact original navy blue logo in light mode */
            filter: none;
          }
        `}
      </style>
      <img 
        src={logoImg} 
        alt="JT Advocacia" 
        className="brand-logo-img" 
        draggable="false"
      />
    </div>
  );
}
