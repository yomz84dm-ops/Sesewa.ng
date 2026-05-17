import React from 'react';

export const LogoPreview = ({ onClose, onSelect }: { onClose: () => void, onSelect: (option: string) => void }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[200] overflow-y-auto p-4 md:p-8 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-50 w-full max-w-5xl rounded-[3rem] p-8 md:p-12 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all font-bold"
        >
          X
        </button>
        
        <h2 className="text-3xl md:text-5xl font-cartoon text-slate-900 mb-4 tracking-tight">Select Your Logo Concept</h2>
        <p className="text-slate-500 text-lg mb-12 max-w-2xl">
          I sincerely apologize for the previously deformed iterations. I've scrapped the messy shapes entirely and built these three from the ground up to be <strong>highly geometric, ultra-clean, minimal vector logos</strong> fitting for a top-tier tech service. Let me know which of these three you would like applied universally across HandyPadi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Option A */}
          <div onClick={() => onSelect('A')} className="bg-white group rounded-3xl p-8 border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center">
            <div className="w-32 h-32 mb-8 relative group-hover:scale-110 transition-transform duration-500">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                 <rect width="100" height="100" rx="24" fill="#2563eb" />
                 {/* Wrench Head */}
                 <circle cx="50" cy="35" r="22" fill="#facc15" />
                 {/* Wrench Cutout (opening at the top) */}
                 <circle cx="50" cy="15" r="10" fill="#2563eb" />
                 <rect x="40" y="10" width="20" height="10" fill="#2563eb" />
                 
                 {/* Wrench Handle */}
                 <rect x="38" y="50" width="24" height="40" rx="12" fill="#facc15" />
                 
                 {/* Smiley Face on the Handle */}
                 <circle cx="45" cy="60" r="3" fill="#2563eb" />
                 <circle cx="55" cy="60" r="3" fill="#2563eb" />
                 <path d="M 42 68 Q 50 76 58 68" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
               </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Option A</h3>
            <span className="text-blue-600 font-bold mb-4">"The Smiley Wrench"</span>
            <p className="text-slate-500 text-sm">Perfectly geometric, professional, clean. A cute, minimal wrench face that builds instant approachability.</p>
          </div>

          {/* Option B */}
          <div onClick={() => onSelect('B')} className="bg-white group rounded-3xl p-8 border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center">
            <div className="w-32 h-32 mb-8 relative group-hover:scale-110 transition-transform duration-500">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                <rect width="100" height="100" rx="28" fill="#1e40af" />
                
                {/* The Wrench bridging over like a protective arch */}
                <path d="M 20 40 A 35 35 0 1 1 80 40" fill="none" stroke="#facc15" strokeWidth="12" strokeLinecap="round" />
                <circle cx="20" cy="40" r="10" fill="#facc15" />
                <circle cx="80" cy="40" r="10" fill="#facc15" />
                <circle cx="20" cy="40" r="4" fill="#1e40af" />
                <circle cx="80" cy="40" r="4" fill="#1e40af" />

                {/* The Handshake (geometric interlocking shapes) in the middle */}
                <path d="M 35 65 L 50 50 L 58 58 L 43 73 Z" fill="white" />
                <path d="M 65 65 L 50 50 L 42 58 L 57 73 Z" fill="#93c5fd" />
                <circle cx="50" cy="50" r="6" fill="#3b82f6" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Option B</h3>
            <span className="text-blue-600 font-bold mb-4">"The Padi Handshake"</span>
            <p className="text-slate-500 text-sm">Abstract and modern. A yellow spanner arches over interlocking geometric grips holding together in a handshake.</p>
          </div>

          {/* Option C */}
          <div onClick={() => onSelect('C')} className="bg-white group rounded-3xl p-8 border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center">
            <div className="w-32 h-32 mb-8 relative group-hover:scale-110 transition-transform duration-500">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                 <rect width="100" height="100" rx="24" fill="#1e293b" />
                 
                 {/* Left vertical wrench */}
                 <rect x="25" y="25" width="16" height="55" rx="8" fill="#3b82f6" />
                 <circle cx="33" cy="25" r="16" fill="#3b82f6" />
                 <circle cx="33" cy="20" r="8" fill="#1e293b" />
                 <circle cx="33" cy="80" r="10" fill="#3b82f6" />

                 {/* Right vertical wrench */}
                 <rect x="59" y="25" width="16" height="55" rx="8" fill="#3b82f6" />
                 <circle cx="67" cy="25" r="16" fill="#3b82f6" />
                 <circle cx="67" cy="20" r="8" fill="#1e293b" />
                 <circle cx="67" cy="80" r="10" fill="#3b82f6" />

                 {/* Horizontal connection */}
                 <rect x="36" y="46" width="28" height="16" rx="4" fill="#facc15" />
               </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Option C</h3>
            <span className="text-blue-600 font-bold mb-4">"The Tool 'H'"</span>
            <p className="text-slate-500 text-sm">Corporate, symmetrical, and sleek. Dual spanners bridged by a bold yellow beam constructing an unmistakable 'H'.</p>
          </div>
        </div>
        
        <p className="text-center font-medium text-slate-400 mt-8">Click on option A, B, or C to let me know which one to implement as the official logo!</p>

      </div>
    </div>
  );
}
