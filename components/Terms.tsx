import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-black tracking-tight mb-2">Terms and Conditions</h1>
        <p className="text-xs opacity-40 font-medium">Last updated: June 2026</p>
      </div>

      <div className="glass rounded-3xl p-6 border border-ui-border space-y-6 text-sm opacity-80 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-primary mb-2">1. Introduction</h2>
          <p>Welcome to FLUX. By using our application, you agree to these Terms and Conditions. Please read them carefully before using the app.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">2. Local Storage</h2>
          <p>FLUX is designed as a local-first Progressive Web Application. All your books, reading progress, and settings are stored locally on your device via IndexedDB. We do not host, backup, or sync your personal library data to any external servers.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">3. Third-Party Content</h2>
          <p>The "Explore" section of FLUX connects to external public APIs such as Project Gutenberg. We are not responsible for the content, copyright status, or availability of books downloaded through these third-party services.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">4. User Responsibility</h2>
          <p>You are solely responsible for the content you upload to your library. Please ensure you have the legal right to read and store the EPUB, PDF, and CBR files you add to the application.</p>
        </section>
        
        <section>
          <h2 className="text-base font-bold text-primary mb-2">5. Liability</h2>
          <p>FLUX is provided "as is" without warranties of any kind. We are not liable for any data loss. We strongly recommend exporting backups of your library JSON periodically using the Settings view.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">6. Developer & Contact</h2>
          <p>FLUX is designed and maintained by MetalSyntax. For more information, updates, or to view other projects, please visit my portfolio at <a href="https://metalsyntax.vercel.app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">metalsyntax.vercel.app</a>.</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
