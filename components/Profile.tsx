import React, { useState, useEffect } from 'react';
import { UserSettings, Book, ReadingSession } from '../types';
import * as db from '../db';
import { getTranslation } from '../translations';

interface ProfileProps {
  settings: UserSettings;
  onUpdate: (s: UserSettings) => void;
  library: Book[];
  onCheckUpdate?: () => void;
  isCheckingUpdate?: boolean;
  onNavigate?: (view: string) => void;
  onDeleteBook?: (id: string) => void;
  deferredPrompt?: any;
  onClearInstallPrompt?: () => void;
}

function calculateStreak(sessions: ReadingSession[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => new Date(s.startTime).toDateString()));
  let streak = 0;
  const check = new Date();
  while (days.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  if (streak === 0) {
    check.setDate(check.getDate() - 1);
    while (days.has(check.toDateString())) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
  }
  return streak;
}

const Profile: React.FC<ProfileProps> = ({ 
  settings, 
  onUpdate, 
  library, 
  onCheckUpdate, 
  isCheckingUpdate, 
  onNavigate, 
  onDeleteBook,
  deferredPrompt,
  onClearInstallPrompt
}) => {
  const t = getTranslation(settings.language || 'en');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(settings.name);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [sessions, setSessions] = useState<ReadingSession[]>([]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      if (onClearInstallPrompt) onClearInstallPrompt();
    }
  };
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(settings.dailyGoal ?? 10));
  
  // Storage usage states
  const [fileSizes, setFileSizes] = useState<{ [bookId: string]: number }>({});
  const [showStorageDetails, setShowStorageDetails] = useState(false);

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage }) => {
        if (usage) setStorageUsed(`${(usage / (1024 * 1024)).toFixed(1)} MB`);
      });
    }
    db.getSessions().then(setSessions);
    db.getFileSizes().then(setFileSizes);
  }, [library]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const todaySessions = sessions.filter((s) => s.startTime >= todayStart.getTime());
  const weekSessions = sessions.filter((s) => s.startTime >= weekStart.getTime());
  const todayMinutes = Math.floor(
    todaySessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / 60000
  );
  const weekMinutes = Math.floor(
    weekSessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / 60000
  );
  const todayPages = todaySessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const booksCompleted = library.filter((b) => b.progress >= 100).length;
  const streak = calculateStreak(sessions);
  const dailyGoal = settings.dailyGoal ?? 10;
  const goalProgress = Math.min(1, todayPages / (dailyGoal || 1));

  // SVG progress ring
  const r = 28;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ * (1 - goalProgress);

  const handleBackup = () => {
    const data = JSON.stringify(
      library.map((b) => ({ ...b, file: undefined })),
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ ...settings, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const saveGoal = () => {
    const parsed = parseInt(goalInput, 10);
    if (parsed > 0) onUpdate({ ...settings, dailyGoal: parsed });
    setEditGoal(false);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDownloadOriginalFile = async (bookId: string) => {
    const file = await db.getFile(bookId);
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center py-4">
        <div className="relative group">
          <div className="size-24 rounded-3xl overflow-hidden border-2 border-primary/20 p-1 bg-ui-bg-muted">
            <img src={settings.avatar} className="w-full h-full rounded-2xl object-cover" alt="Avatar" />
          </div>
          <label className="absolute -bottom-2 -right-2 size-8 bg-primary rounded-lg flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white text-sm">edit</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="mt-4 text-center">
          {isEditing ? (
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-ui-bg-accented border border-ui-border rounded-lg px-2 py-1 text-center font-bold"
              onBlur={() => { onUpdate({ ...settings, name: newName }); setIsEditing(false); }}
              autoFocus
            />
          ) : (
            <h2
              onClick={() => setIsEditing(true)}
              className="text-xl font-bold flex items-center gap-2 cursor-pointer group"
            >
              {settings.name}
              <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-40">edit</span>
            </h2>
          )}
          <div className="flex items-center justify-center gap-2 mt-1">
            {streak > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-widest">
                {streak === 1 ? t.streakDays.replace('{{count}}', '1') : t.streakDaysPlural.replace('{{count}}', String(streak))}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ui-bg-accented text-ui-text-muted uppercase tracking-widest">
                {t.noStreak}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Daily Goal Ring + Stats Row */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={r} fill="none" style={{ stroke: 'var(--ui-border)' }} strokeWidth="5" />
              <circle
                cx="36" cy="36" r={r}
                fill="none" stroke="var(--color-primary)" strokeWidth="5"
                strokeDasharray={circ}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold">{todayPages}</span>
              <span className="text-[8px] opacity-40 uppercase">pg</span>
            </div>
          </div>

          {/* Goal label + edit */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{t.dailyGoal}</span>
              <button onClick={() => setEditGoal(true)} className="opacity-30 hover:opacity-70">
                <span className="material-symbols-outlined text-xs">edit</span>
              </button>
            </div>
            {editGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-16 bg-ui-bg-accented border border-ui-border rounded px-2 py-0.5 text-sm text-center"
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                  autoFocus
                />
                <span className="text-xs opacity-40">{settings.language === 'es' ? 'págs/día' : settings.language === 'pt' ? 'págs/dia' : 'pages/day'}</span>
                <button onClick={saveGoal} className="text-primary text-xs font-bold">{t.save}</button>
              </div>
            ) : (
              <p className="text-[10px] opacity-40">
                {settings.language === 'es' 
                  ? `${todayPages} / ${dailyGoal} páginas hoy` 
                  : settings.language === 'pt' 
                  ? `${todayPages} / ${dailyGoal} páginas hoje` 
                  : `${todayPages} / ${dailyGoal} pages today`}
              </p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-ui-border">
          {[
            { label: settings.language === 'es' ? 'Hoy' : settings.language === 'pt' ? 'Hoje' : 'Today', value: todayMinutes < 60 ? `${todayMinutes}m` : `${Math.floor(todayMinutes / 60)}h` },
            { label: settings.language === 'es' ? 'Semana' : settings.language === 'pt' ? 'Semana' : 'Week', value: weekMinutes < 60 ? `${weekMinutes}m` : `${Math.floor(weekMinutes / 60)}h` },
            { label: settings.language === 'es' ? 'Páginas' : settings.language === 'pt' ? 'Páginas' : 'Pages', value: totalPages > 999 ? `${(totalPages / 1000).toFixed(1)}k` : String(totalPages) },
            { label: settings.language === 'es' ? 'Listos' : settings.language === 'pt' ? 'Prontos' : 'Done', value: String(booksCompleted) },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[9px] opacity-30 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Theme selector */}
      <div>
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-3 ml-1">{t.theme}</p>
        <div className="grid grid-cols-3 gap-2 p-1 bg-ui-bg-muted rounded-2xl">
          {(['dark', 'black', 'white'] as const).map((themeName) => {
            let label = t.themeDark;
            if (themeName === 'black') label = t.themeBlack;
            if (themeName === 'white') label = t.themeWhite;
            return (
              <button
                key={themeName}
                onClick={() => onUpdate({ ...settings, theme: themeName })}
                className={`py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${
                  settings.theme === themeName ? 'bg-primary text-white' : 'opacity-40 hover:opacity-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language selector */}
      <div>
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-3 ml-1">{t.language}</p>
        <div className="grid grid-cols-3 gap-2 p-1 bg-ui-bg-muted rounded-2xl">
          {(['en', 'es', 'pt'] as const).map((langName) => (
            <button
              key={langName}
              onClick={() => onUpdate({ ...settings, language: langName })}
              className={`py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${
                (settings.language || 'en') === langName ? 'bg-primary text-white' : 'opacity-40 hover:opacity-100'
              }`}
            >
              {langName === 'en' ? 'English' : langName === 'es' ? 'Español' : 'Português'}
            </button>
          ))}
        </div>
      </div>

      {/* NSFW Blur toggle */}
      <div className="flex items-center justify-between glass p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined opacity-40">visibility</span>
          <div>
            <p className="text-xs font-bold">{t.showNsfw}</p>
          </div>
        </div>
        <button
          onClick={() => onUpdate({ ...settings, showNsfw: !settings.showNsfw })}
          className={`relative w-10 h-5 rounded-full transition-colors ${settings.showNsfw ? 'bg-primary' : 'bg-ui-bg-accented'}`}
        >
          <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-all ${settings.showNsfw ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Storage & Backup */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] ml-1">{t.backupRestore}</p>
        
        {/* Storage row with detail popup action */}
        <button
          onClick={() => setShowStorageDetails(true)}
          className="w-full glass p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined opacity-40">database</span>
            <div>
              <p className="text-xs font-bold">{t.storageUsed}</p>
              <p className="text-[10px] opacity-40">
                {settings.language === 'es' ? 'Ver detalles de almacenamiento' : settings.language === 'pt' ? 'Ver detalhes do armazenamento' : 'View storage details'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-60">{storageUsed}</span>
            <span className="material-symbols-outlined text-sm opacity-40 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </button>

        <button
          onClick={handleBackup}
          className="w-full glass p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined opacity-40">backup</span>
            <p className="text-xs font-bold">{t.downloadBackup}</p>
          </div>
          <span className="material-symbols-outlined text-sm opacity-40 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => onNavigate && onNavigate('terms')}
            className="glass p-3 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-ui-bg-accented transition-all text-center"
          >
            <span className="material-symbols-outlined text-[14px] opacity-40">gavel</span>
            <span className="text-[9px] font-bold opacity-80 truncate">{t.terms}</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('privacy')}
            className="glass p-3 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-ui-bg-accented transition-all text-center"
          >
            <span className="material-symbols-outlined text-[14px] opacity-40">shield</span>
            <span className="text-[9px] font-bold opacity-80 truncate">{t.privacy}</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('faq')}
            className="glass p-3 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-ui-bg-accented transition-all text-center"
          >
            <span className="material-symbols-outlined text-[14px] opacity-40">help</span>
            <span className="text-[9px] font-bold opacity-80 truncate">{t.faq}</span>
          </button>
        </div>

        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full bg-primary hover:bg-primary/95 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg hover:shadow-primary/20 transition-all mt-4 mb-2 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white">download</span>
              <p className="text-xs font-bold">
                {settings.language === 'es' ? 'Instalar aplicación FLUX' : settings.language === 'pt' ? 'Instalar aplicativo FLUX' : 'Install FLUX App'}
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">
              {settings.language === 'es' ? 'Instalar' : settings.language === 'pt' ? 'Instalar' : 'Install'}
            </span>
          </button>
        )}

        {onCheckUpdate && (
          <button
            onClick={onCheckUpdate}
            disabled={isCheckingUpdate}
            className="w-full glass p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {isCheckingUpdate ? (
                <div className="size-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined opacity-40">update</span>
              )}
              <p className="text-xs font-bold">{t.checkUpdates}</p>
            </div>
            {!isCheckingUpdate && (
              <span className="text-[10px] opacity-40 uppercase tracking-widest group-hover:text-primary transition-colors">
                {settings.language === 'es' ? 'Buscar' : settings.language === 'pt' ? 'Buscar' : 'Check'}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="p-5 glass rounded-2xl text-center">
        <p className="text-xs opacity-40">FLUX v1.1</p>
        <p className="text-[9px] opacity-20 mt-1">
          {settings.language === 'es' 
            ? 'Todos los datos están guardados localmente en su navegador.' 
            : settings.language === 'pt' 
            ? 'Todos os dados são armazenados localmente no seu navegador.' 
            : 'All data is stored locally in your browser.'}
        </p>
      </div>

      {/* Storage Details Popup */}
      {showStorageDetails && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-premium rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 max-h-[85vh] flex flex-col text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="flex items-center justify-between pb-3 border-b border-ui-border mb-4">
              <h3 className="text-base font-bold">
                {settings.language === 'es' ? 'Almacenamiento Local' : settings.language === 'pt' ? 'Armazenamento Local' : 'Local Storage Details'}
              </h3>
              <button onClick={() => setShowStorageDetails(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
              {library.length === 0 ? (
                <p className="text-xs opacity-50 py-8 text-center">
                  {settings.language === 'es' ? 'No hay libros guardados.' : settings.language === 'pt' ? 'Nenhum livro salvo.' : 'No saved books.'}
                </p>
              ) : (
                library.map((book) => {
                  const size = fileSizes[book.id] || 0;
                  return (
                    <div key={book.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-ui-border hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-12 rounded-xl overflow-hidden bg-ui-bg-accented shrink-0">
                          {book.coverUrl 
                            ? <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />
                            : <div className="w-full h-full flex items-center justify-center opacity-20"><span className="material-symbols-outlined text-xl">auto_stories</span></div>
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{book.title}</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-widest mt-0.5">{book.type} • {formatBytes(size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Download original format */}
                        <button
                          onClick={() => handleDownloadOriginalFile(book.id)}
                          className="size-8 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                          title={settings.language === 'es' ? 'Descargar archivo original' : settings.language === 'pt' ? 'Baixar arquivo original' : 'Download original file'}
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                        
                        {/* Delete book */}
                        {onDeleteBook && (
                          <button
                            onClick={() => {
                              if (confirm(settings.language === 'es' ? `¿Estás seguro de eliminar "${book.title}"?` : settings.language === 'pt' ? `Tem certeza que deseja excluir "${book.title}"?` : `Are you sure you want to delete "${book.title}"?`)) {
                                onDeleteBook(book.id);
                              }
                            }}
                            className="size-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title={t.deleteBook}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-ui-border flex justify-between items-center">
              <span className="text-xs opacity-60 font-bold">{settings.language === 'es' ? 'Total aproximado:' : settings.language === 'pt' ? 'Total aproximado:' : 'Total approximate:'}</span>
              <span className="text-xs font-black text-primary">{storageUsed}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
