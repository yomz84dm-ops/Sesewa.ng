import React from 'react';
import logo from '../assets/logo.jpg';

export const Logo = ({ size, className = "" }: { size?: number, className?: string }) => {
  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center ${className} ${!size && !className.includes('w-') ? 'w-12 h-12' : ''}`}
      style={size ? { width: size, height: size } : {}}
    >
      <img 
        src={logo} 
        alt="HandyPadi Logo" 
        className="max-w-full max-h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
