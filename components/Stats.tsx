import React, { useEffect, useState } from 'react';
import { Book, UserSettings } from '../types';

interface StatsProps {
  library: Book[];
  settings: UserSettings;
}

const Stats: React.FC<StatsProps> = ({ library, settings }) => {
  const [totalBooks, setTotalBooks] = useState(0);
  const [completedBooks, setCompletedBooks] = useState(0);
  const [totalPagesRead, setTotalPagesRead] = useState(0);
  const [favoriteBooks, setFavoriteBooks] = useState(0);

  useEffect(() => {
    setTotalBooks(library.length);
    setCompletedBooks(library.filter((b) => b.progress >= 100).length);
    setFavoriteBooks(library.filter((b) => b.isFavorite).length);
    
    const pages = library.reduce((acc, b) => acc + (b.currentPage > 1 ? b.currentPage : 0), 0);
    setTotalPagesRead(pages);
  }, [library]);

  const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
    <div className="glass rounded-3xl p-5 border border-ui-border relative overflow-hidden group hover:border-primary/30 transition-all">
      <div className="absolute -right-4 -top-4 size-20 rounded-full opacity-10 transition-transform group-hover:scale-150" style={{ backgroundColor: color }} />
      <div className="size-10 rounded-xl mb-4 flex items-center justify-center shadow-lg" style={{ backgroundColor: `${color}22` }}>
        <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
      </div>
      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight mb-2">Reading Stats</h1>
        <p className="text-xs opacity-40 font-medium">Track your reading progress over time.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Books in Library" value={totalBooks} icon="library_books" color="#00c08b" />
        <StatCard title="Completed" value={completedBooks} icon="task_alt" color="#16a34a" />
        <StatCard title="Pages Read" value={totalPagesRead} icon="menu_book" color="#7c3aed" />
        <StatCard title="Favorites" value={favoriteBooks} icon="favorite" color="#dc2626" />
      </div>

      <div className="glass rounded-3xl p-6 border border-ui-border mt-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Daily Goal</p>
            <p className="text-xl font-bold">{settings.dailyGoal} Pages / Day</p>
          </div>
          <div className="size-14 rounded-full border-4 border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">local_fire_department</span>
          </div>
        </div>
        <p className="text-xs opacity-50">Keep reading every day to build your streak and reach your goals!</p>
      </div>
    </div>
  );
};

export default Stats;
