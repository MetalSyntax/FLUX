
import React from 'react';
import { Book, BookType } from '../types';

interface DiscoverProps {
  onOpenBook: (book: Book) => void;
}

const Discover: React.FC<DiscoverProps> = ({ onOpenBook }) => {
  const featured = [
    { id: 'f1', title: 'Neon Tokyo 2099', genre: 'Sci-Fi • Manga', cover: 'https://picsum.photos/seed/neon/800/1000' },
    { id: 'f2', title: 'The Last Knight', genre: 'Fantasy • Epic', cover: 'https://picsum.photos/seed/knight/800/1000' }
  ];

  return (
    <div className="space-y-8">
      {/* Featured Header */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Featured</h2>
          <button className="text-primary text-sm font-bold">View all</button>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4">
          {featured.map(item => (
            <div key={item.id} className="relative flex-none w-[85vw] aspect-[4/5] rounded-3xl overflow-hidden snap-center group shadow-2xl">
              <img src={item.cover} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-5 left-5 right-5 glass rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{item.title}</p>
                  <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{item.genre}</p>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white size-11 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-primary/40">
                  <span className="material-symbols-outlined">menu_book</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Releases Grid */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Popular Releases</h2>
          <button className="text-primary text-sm font-bold">See More</button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex-none w-32 cursor-pointer group">
              <div className="aspect-[2/3] w-full rounded-xl glass border border-white/10 mb-2 overflow-hidden shadow-md">
                <img src={`https://picsum.photos/seed/pop${i}/300/450`} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="text-[12px] font-bold line-clamp-1">Silent Echoes #{i}</p>
              <p className="text-[10px] text-slate-500">Manga • Ch 42</p>
            </div>
          ))}
        </div>
      </section>

      {/* Continue Reading Mini-Card */}
      <section className="px-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
          <div className="size-16 rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img src="https://picsum.photos/seed/current/200/200" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Continue Reading</p>
            <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">Neon Tokyo 2099</p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
              <div className="h-full bg-primary shadow-[0_0_8px_rgba(19,55,236,0.6)]" style={{ width: '65%' }}></div>
            </div>
          </div>
          <button className="text-primary">
            <span className="material-symbols-outlined text-4xl">play_circle</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Discover;
