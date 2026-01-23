
import React from 'react';
import { UserSettings } from '../types';

interface TopNavProps {
  settings: UserSettings;
  onProfileClick: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ settings, onProfileClick }) => {
  return (
    <nav className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center justify-between">
      <button 
        onClick={onProfileClick}
        className="size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
      >
        <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
      </button>
      
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-lg font-bold tracking-tight opacity-90">GlassReader</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative size-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-xl opacity-70">notifications</span>
          <span className="absolute top-2.5 right-2.5 size-2 bg-blue-500 rounded-full border-2 border-current"></span>
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
