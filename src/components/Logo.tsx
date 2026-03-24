import React from 'react';
import logo from '../assets/logo.jpg';

export const Logo = ({ size, className = "" }: { size?: number, className?: string }) => {
  return (
    <div 
      className={`relative overflow-hidden shrink-0 ${className}`}
      style={size ? { width: size, height: size } : {}}
    >
      <img 
        src={logo} 
        alt="Ṣe Ṣe Wá Logo" 
        className="w-full h-full object-contain scale-[2.0]"
        style={{ 
          filter: 'hue-rotate(190deg) contrast(1.2) brightness(1.05) saturate(1.3)',
          mixBlendMode: 'multiply'
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
