import React from 'react';

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`
      w-full aspect-square flex flex-col items-center justify-center gap-1 
      rounded-xl transition
      ${active 
        ? 'bg-white/10 text-white' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }
    `}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default NavButton;