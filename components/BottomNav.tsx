
import React from 'react';
import { ViewType, UserSettings } from '../types';
import { getTranslation } from '../translations';

interface BottomNavProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onAddClick: () => void;
  settings: UserSettings;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate, onAddClick, settings }) => {
  const t = getTranslation(settings.language || 'en');

  const NavItem: React.FC<{ view: ViewType; icon: string; label: string }> = ({ view, icon, label }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300 gap-1 ${
          isActive ? 'text-primary' : 'text-ui-text-muted hover:opacity-80'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {icon}
        </span>
        <span className="text-[9px] font-bold tracking-widest uppercase">{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6">
      <div className="relative mx-auto max-w-md h-[72px] rounded-[2rem] glass-dark flex items-center border border-ui-border shadow-2xl overflow-visible px-2">
        {/* Left nav items */}
        <div className="flex flex-1 justify-around">
          <NavItem view={ViewType.HOME} icon="grid_view" label={t.library} />
          <NavItem view={ViewType.DISCOVER} icon="explore" label={t.explore} />
        </div>

        {/* Central Add Button */}
        <div className="relative -top-7 mx-2">
          <button
            onClick={onAddClick}
            className="size-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 active:scale-90 transition-all border-[6px] hover:brightness-110"
            style={{ borderColor: 'var(--ui-bg)', background: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined text-3xl font-bold text-white">add</span>
          </button>
        </div>

        {/* Right nav items */}
        <div className="flex flex-1 justify-around">
          <NavItem view={ViewType.STATS} icon="bar_chart" label={t.stats} />
          <NavItem view={ViewType.PROFILE} icon="person" label={t.profile} />
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
