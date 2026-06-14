import React, { useEffect, useState } from 'react';
import { Book, UserSettings } from '../types';
import { getTranslation } from '../translations';

interface StatsProps {
  library: Book[];
  settings: UserSettings;
}

const Stats: React.FC<StatsProps> = ({ library, settings }) => {
  const t = getTranslation(settings.language || 'en');

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

  const StatCard = ({ title, value, icon, colorName }: { title: string, value: string | number, icon: string, colorName: string }) => (
    <div className="glass rounded-3xl p-5 border border-ui-border relative overflow-hidden group hover:border-primary/30 transition-all">
      <div className="absolute -right-4 -top-4 size-20 rounded-full opacity-10 transition-transform group-hover:scale-150" style={{ backgroundColor: `var(--color-${colorName})` }} />
      <div className="size-10 rounded-xl mb-4 flex items-center justify-center shadow-lg" style={{ backgroundColor: `rgba(var(--color-${colorName}-rgb), 0.13)` }}>
        <span className="material-symbols-outlined text-xl" style={{ color: `var(--color-${colorName})` }}>{icon}</span>
      </div>
      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight mb-2">{t.statsTitle}</h1>
        <p className="text-xs opacity-40 font-medium">
          {settings.language === 'es' ? 'Sigue tu progreso de lectura a lo largo del tiempo.' : settings.language === 'pt' ? 'Acompanhe seu progresso de leitura ao longo do tempo.' : 'Track your reading progress over time.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title={t.library} value={totalBooks} icon="library_books" colorName="primary" />
        <StatCard title={t.completed} value={completedBooks} icon="task_alt" colorName="green" />
        <StatCard title={t.pagesRead} value={totalPagesRead} icon="menu_book" colorName="purple" />
        <StatCard title={t.filterFavorites} value={favoriteBooks} icon="favorite" colorName="red" />
      </div>

      <div className="glass rounded-3xl p-6 border border-ui-border mt-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">{t.dailyGoal}</p>
            <p className="text-xl font-bold">
              {settings.dailyGoal} {settings.language === 'es' ? 'Páginas / Día' : settings.language === 'pt' ? 'Páginas / Dia' : 'Pages / Day'}
            </p>
          </div>
          <div className="size-14 rounded-full border-4 border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">local_fire_department</span>
          </div>
        </div>
        <p className="text-xs opacity-50">
          {settings.language === 'es' 
            ? '¡Sigue leyendo todos los días para crear una racha y alcanzar tus metas!' 
            : settings.language === 'pt' 
            ? 'Continue lendo todos os dias para construir sua racha e alcançar seus objetivos!' 
            : 'Keep reading every day to build your streak and reach your goals!'}
        </p>
      </div>
    </div>
  );
};

export default Stats;
