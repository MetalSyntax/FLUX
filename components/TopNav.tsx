
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
        className="size-10 rounded-full bg-ui-bg-accented border border-ui-border flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
      >
        <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-lg font-bold tracking-[0.25em] opacity-90 uppercase">FLUX</h1>
      </div>

      <div className="flex items-center gap-3" />
    </nav>
  );
};

export default TopNav;
