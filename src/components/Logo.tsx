import React from 'react';
import { motion } from 'motion/react';

export const Logo = ({ size, className = "" }: { size?: number, className?: string }) => {
  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center ${className} ${!size && !className.includes('w-') ? 'w-12 h-12' : ''}`}
      style={size ? { width: size, height: size } : {}}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
        {/* Round background */}
        <circle cx="50" cy="50" r="48" fill="#2563eb" />
        
        {/* Animated Wrench 'Padi' Group */}
        <motion.g
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "50px 70px" }}
        >
          {/* Wrench Handle */}
          <rect x="38" y="45" width="24" height="40" rx="12" fill="#facc15" />
          
          {/* Wrench Head */}
          <circle cx="50" cy="35" r="22" fill="#facc15" />
          {/* Wrench Cutout (opening at the top) */}
          <circle cx="50" cy="15" r="10" fill="#2563eb" />
          <rect x="40" y="5" width="20" height="10" fill="#2563eb" />

          {/* Eyes (Blinking Animation) */}
          <motion.g
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1], ease: "easeInOut" }}
            style={{ transformOrigin: "50px 35px" }}
          >
            <circle cx="43" cy="35" r="3.5" fill="#2563eb" />
            <circle cx="57" cy="35" r="3.5" fill="#2563eb" />
          </motion.g>
          
          {/* Smile */}
          <path d="M 42 43 Q 50 50 58 43" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
        </motion.g>

        {/* Shine / Highlight effect on the blue circle */}
        <path d="M 15 25 Q 50 5 85 25" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
      </svg>
    </div>
  );
};

