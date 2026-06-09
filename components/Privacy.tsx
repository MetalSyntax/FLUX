import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs opacity-40 font-medium">Last updated: June 2026</p>
      </div>

      <div className="glass rounded-3xl p-6 border border-white/5 space-y-6 text-sm opacity-80 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-primary mb-2">1. Data Collection</h2>
          <p>FLUX prioritizes your privacy. We do not collect, transmit, or store any personal data, reading habits, or library metadata on our servers. The app operates entirely offline by default after the initial load.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">2. Local Storage (IndexedDB)</h2>
          <p>All your books, progress tracking, bookmarks, and app preferences are stored exclusively on your device using your browser's IndexedDB and LocalStorage APIs. This means your data never leaves your device unless you explicitly export it.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">3. External Requests</h2>
          <p>The only network requests made by FLUX are:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 opacity-80">
            <li>Fetching app updates from GitHub APIs.</li>
            <li>Searching and downloading public domain books from Project Gutenberg and CORS proxies.</li>
            <li>Opening in-app browser windows for external archives (e.g., Anna's Archive, Libgen) at your direct request.</li>
          </ul>
          <p className="mt-2">These services have their own privacy policies which apply when you interact with them.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">4. Analytics & Tracking</h2>
          <p>We do not use any third-party analytics trackers, crash reporters, or advertising SDKs. Your reading experience is completely private and untracked.</p>
        </section>
        
        <section>
          <h2 className="text-base font-bold text-primary mb-2">5. Changes to this Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect new features or changes in regulations. Since the app is locally hosted, changes will take effect when you download a new update.</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
