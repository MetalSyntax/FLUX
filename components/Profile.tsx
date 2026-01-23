
import React, { useState, useEffect } from 'react';
import { UserSettings, Book } from '../types';

interface ProfileProps {
  settings: UserSettings;
  onUpdate: (s: UserSettings) => void;
  library: Book[];
}

const Profile: React.FC<ProfileProps> = ({ settings, onUpdate, library }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(settings.name);
  const [storageUsed, setStorageUsed] = useState('0 MB');

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage }) => {
        if (usage) setStorageUsed(`${(usage / (1024 * 1024)).toFixed(1)} MB`);
      });
    }
  }, [library]);

  const handleBackup = () => {
    const data = JSON.stringify(library.map(b => ({ ...b, file: undefined })), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glassreader-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...settings, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <div className="size-24 rounded-3xl overflow-hidden border-2 border-primary/20 p-1 bg-white/5">
            <img src={settings.avatar} className="w-full h-full rounded-2xl object-cover" alt="Avatar" />
          </div>
          <label className="absolute -bottom-2 -right-2 size-8 bg-primary rounded-lg flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white text-sm">edit</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>
        
        <div className="mt-4 text-center">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center font-bold"
                onBlur={() => { onUpdate({...settings, name: newName}); setIsEditing(false); }}
                autoFocus
              />
            </div>
          ) : (
            <h2 onClick={() => setIsEditing(true)} className="text-xl font-bold flex items-center gap-2 cursor-pointer group">
              {settings.name} <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-40">edit</span>
            </h2>
          )}
          <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] mt-1">Premium Reader</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl">
        {(['dark', 'black', 'white'] as const).map(t => (
          <button 
            key={t}
            onClick={() => onUpdate({...settings, theme: t})}
            className={`py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${
              settings.theme === t ? 'bg-primary text-white' : 'opacity-40 hover:opacity-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] ml-2">Storage & Backup</h3>
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
          <span className="material-symbols-outlined text-sm opacity-40 group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>

      <div className="p-6 glass rounded-2xl text-center">
        <p className="text-xs opacity-40">GlassReader v2.1 (Offline Edition)</p>
        <p className="text-[9px] opacity-20 mt-1">All data is stored locally in your browser.</p>
      </div>
    </div>
  );
};

export default Profile;
