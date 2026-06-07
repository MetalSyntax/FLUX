
import React from 'react';
import { ViewType } from '../types';

interface BottomNavProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onAddClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate, onAddClick }) => {
  const NavItem: React.FC<{ view: ViewType; icon: string }> = ({ view, icon }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`flex-1 flex justify-center py-4 transition-all duration-300 ${
          isActive ? 'text-primary' : 'text-white/30 hover:text-white/60'
        }`}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {icon}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8">
      <div className="relative mx-auto max-w-sm h-16 rounded-[2rem] glass-dark flex items-center border border-white/10 shadow-2xl overflow-visible px-4">
        {/* Left nav items */}
        <div className="flex flex-1 justify-around">
          <NavItem view={ViewType.HOME} icon="grid_view" />
          <NavItem view={ViewType.DISCOVER} icon="explore" />
        </div>

        {/* Central Add Button */}
        <div className="relative -top-6 mx-4">
          <button
            onClick={onAddClick}
            className="size-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 active:scale-90 transition-all border-[6px] hover:brightness-110"
            style={{ borderColor: '#101628', background: '#2563eb' }}
          >
            <span className="material-symbols-outlined text-3xl font-bold text-white">add</span>
          </button>
        </div>

        {/* Right nav items */}
        <div className="flex flex-1 justify-around">
          <NavItem view={ViewType.PROFILE} icon="person" />
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
