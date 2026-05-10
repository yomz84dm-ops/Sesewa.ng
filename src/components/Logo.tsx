import React from 'react';
import logo from '../assets/logo.jpg';

export const Logo = ({ size, className = "" }: { size?: number, className?: string }) => {
  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center ${className}`}
      style={size ? { width: size, height: size } : {}}
    >
      <img 
        src={logo} 
        alt="Ṣe Ṣe Wá Logo" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
