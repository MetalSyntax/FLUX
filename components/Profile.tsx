
import React, { useState, useEffect } from 'react';
import { UserSettings, Book, ReadingSession } from '../types';
import * as db from '../db';

interface ProfileProps {
  settings: UserSettings;
  onUpdate: (s: UserSettings) => void;
  library: Book[];
  onCheckUpdate?: () => void;
  isCheckingUpdate?: boolean;
  onNavigate?: (view: string) => void;
}

const COLLECTION_COLORS = ['#00c08b', '#7c3aed', '#dc2626', '#16a34a', '#d97706', '#0891b2'];

function calculateStreak(sessions: ReadingSession[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => new Date(s.startTime).toDateString()));
  let streak = 0;
  const check = new Date();
  while (days.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  // If today has no session, check from yesterday (streak not broken yet today)
  if (streak === 0) {
    check.setDate(check.getDate() - 1);
    while (days.has(check.toDateString())) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
  }
  return streak;
}

const Profile: React.FC<ProfileProps> = ({ settings, onUpdate, library, onCheckUpdate, isCheckingUpdate, onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(settings.name);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(settings.dailyGoal ?? 10));

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage }) => {
        if (usage) setStorageUsed(`${(usage / (1024 * 1024)).toFixed(1)} MB`);
      });
    }
    db.getSessions().then(setSessions);
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
            {streak > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-widest">
                {streak} day streak
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
                fill="none" stroke="#00c08b" strokeWidth="5"
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
              <span className="text-xs font-bold">Daily Goal</span>
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
                <span className="text-xs opacity-40">pages/day</span>
                <button onClick={saveGoal} className="text-primary text-xs font-bold">Save</button>
              </div>
            ) : (
              <p className="text-[10px] opacity-40">{todayPages} / {dailyGoal} pages today</p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-ui-border">
          {[
            { label: 'Today', value: todayMinutes < 60 ? `${todayMinutes}m` : `${Math.floor(todayMinutes / 60)}h` },
            { label: 'Week', value: weekMinutes < 60 ? `${weekMinutes}m` : `${Math.floor(weekMinutes / 60)}h` },
            { label: 'Pages', value: totalPages > 999 ? `${(totalPages / 1000).toFixed(1)}k` : String(totalPages) },
            { label: 'Done', value: String(booksCompleted) },
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
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-3 ml-1">Theme</p>
        <div className="grid grid-cols-3 gap-2 p-1 bg-ui-bg-muted rounded-2xl">
          {(['dark', 'black', 'white'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onUpdate({ ...settings, theme: t })}
              className={`py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${
                settings.theme === t ? 'bg-primary text-white' : 'opacity-40 hover:opacity-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Storage & Backup */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] ml-1">Storage & Backup</p>
        <div className="glass p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined opacity-40">database</span>
            <div>
              <p className="text-xs font-bold">Storage Usage</p>
              <p className="text-[10px] opacity-40">IndexedDB local files</p>
            </div>
          </div>
          <span className="text-xs font-bold opacity-60">{storageUsed}</span>
        </div>

        <button
          onClick={handleBackup}
          className="w-full glass p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined opacity-40">backup</span>
            <p className="text-xs font-bold">Export Library JSON</p>
          </div>
          <span className="material-symbols-outlined text-sm opacity-40 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onNavigate && onNavigate('terms')}
            className="glass p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-ui-bg-accented transition-all"
          >
            <span className="material-symbols-outlined text-[14px] opacity-40">gavel</span>
            <span className="text-[10px] font-bold opacity-80">Terms & Conds</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('privacy')}
            className="glass p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-ui-bg-accented transition-all"
          >
            <span className="material-symbols-outlined text-[14px] opacity-40">shield</span>
            <span className="text-[10px] font-bold opacity-80">Privacy Policy</span>
          </button>
        </div>

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
              <p className="text-xs font-bold">Check for Updates</p>
            </div>
            {!isCheckingUpdate && (
              <span className="text-[10px] opacity-40 uppercase tracking-widest group-hover:text-primary transition-colors">Check</span>
            )}
          </button>
        )}
      </div>

      <div className="p-5 glass rounded-2xl text-center">
        <p className="text-xs opacity-40">FLUX v2.0</p>
        <p className="text-[9px] opacity-20 mt-1">All data is stored locally in your browser.</p>
      </div>
    </div>
  );
};

export default Profile;
