import React from 'react';
import { UserSettings } from '../types';

interface PrivacyProps {
  settings: UserSettings;
}

const Privacy: React.FC<PrivacyProps> = ({ settings }) => {
  const lang = settings.language || 'en';

  if (lang === 'es') {
    return (
      <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-black tracking-tight mb-2">Política de Privacidad</h1>
          <p className="text-xs opacity-40 font-medium">Última actualización: Junio 2026</p>
        </div>

        <div className="glass rounded-3xl p-6 border border-ui-border space-y-6 text-sm opacity-80 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-primary mb-2">1. Recopilación de Datos</h2>
            <p>FLUX prioriza tu privacidad. No recopilamos, transmitimos ni almacenamos ningún dato personal, hábitos de lectura o metadatos de biblioteca en nuestros servidores. La aplicación funciona completamente sin conexión por defecto después de la carga inicial.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">2. Almacenamiento Local (IndexedDB)</h2>
            <p>Todos tus libros, seguimiento del progreso, marcadores y preferencias del sistema se almacenan exclusivamente en tu dispositivo utilizando las APIs IndexedDB y LocalStorage de tu navegador. Esto significa que tus datos nunca salen de tu dispositivo a menos que los exportes explícitamente.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">3. Peticiones Externas</h2>
            <p>Las únicas peticiones de red realizadas por FLUX son:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 opacity-80">
              <li>Buscar actualizaciones del sistema desde las APIs de GitHub.</li>
              <li>Buscar y descargar libros de dominio público desde Project Gutenberg y servidores proxy CORS.</li>
              <li>Abrir ventanas de navegación web en la app para archivos externos (ej. Anna's Archive o Libgen) bajo tu solicitud directa.</li>
            </ul>
            <p className="mt-2">Estos servicios cuentan con sus propias políticas de privacidad que se aplican al interactuar con ellos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">4. Análisis y Seguimiento</h2>
            <p>No utilizamos rastreadores de análisis de terceros, informes de errores automáticos ni SDKs de publicidad. Tu experiencia de lectura es totalmente privada y libre de seguimiento.</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold text-primary mb-2">5. Cambios en esta Política</h2>
            <p>Podemos actualizar esta Política de Privacidad de vez en cuando para reflejar nuevas funciones o cambios regulatorios. Dado que la aplicación está alojada localmente, los cambios entrarán en vigor cuando descargues una nueva actualización.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">6. Desarrollador y Contacto</h2>
            <p>FLUX es desarrollado por MetalSyntax. Si tienes alguna pregunta sobre cómo se manejan tus datos o deseas ver más de mi trabajo, visita <a href="https://metalsyntax.vercel.app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">metalsyntax.vercel.app</a>.</p>
          </section>
        </div>
      </div>
    );
  }

  if (lang === 'pt') {
    return (
      <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-black tracking-tight mb-2">Política de Privacidade</h1>
          <p className="text-xs opacity-40 font-medium">Última atualização: Junho 2026</p>
        </div>

        <div className="glass rounded-3xl p-6 border border-ui-border space-y-6 text-sm opacity-80 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-primary mb-2">1. Coleta de Dados</h2>
            <p>O FLUX prioriza sua privacidade. Não coletamos, transmitimos ou armazenamos quaisquer dados pessoais, hábitos de leitura ou metadados de biblioteca em nossos servidores. O aplicativo opera inteiramente offline por padrão após o carregamento inicial.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">2. Armazenamento Local (IndexedDB)</h2>
            <p>Todos os seus livros, rastreamento de progresso, favoritos e preferências do aplicativo são armazenados exclusivamente no seu dispositivo usando as APIs IndexedDB e LocalStorage do seu navegador. Isso significa que seus dados nunca saem do seu dispositivo, a menos que você os exporte explicitamente.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">3. Solicitações Externas</h2>
            <p>As únicas solicitações de rede feitas pelo FLUX são:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 opacity-80">
              <li>Buscar atualizações do aplicativo nas APIs do GitHub.</li>
              <li>Pesquisar e baixar livros de domínio público do Project Gutenberg e proxies CORS.</li>
              <li>Abrir janelas de navegação no aplicativo para acervos externos (ex., Anna's Archive, Libgen) a seu pedido direto.</li>
            </ul>
            <p className="mt-2">Esses serviços têm suas próprias políticas de privacidade que se aplicam quando você interage com eles.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">4. Análise e Rastreamento</h2>
            <p>Não usamos rastreadores de análise de terceiros, relatórios de falhas ou SDKs de publicidade. Sua experiência de leitura é totalmente privada e livre de rastreamento.</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold text-primary mb-2">5. Alterações nesta Política</h2>
            <p>Podemos atualizar esta Política de Privacidade de tempos em tempos para refletir novos recursos ou mudanças nos regulamentos. Como o aplicativo é hospedado localmente, as alterações entrarão em vigor quando você baixar uma nova atualização.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">6. Desenvolvedor e Contato</h2>
            <p>O FLUX é desenvolvido por MetalSyntax. Se você tiver alguma dúvida sobre como seus dados são tratados ou quiser ver mais do meu trabalho, visite <a href="https://metalsyntax.vercel.app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">metalsyntax.vercel.app</a>.</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs opacity-40 font-medium">Last updated: June 2026</p>
      </div>

      <div className="glass rounded-3xl p-6 border border-ui-border space-y-6 text-sm opacity-80 leading-relaxed">
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

        <section>
          <h2 className="text-base font-bold text-primary mb-2">6. Developer & Contact</h2>
          <p>FLUX is developed by MetalSyntax. If you have any questions about how your data is handled or wish to see more of my work, visit <a href="https://metalsyntax.vercel.app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">metalsyntax.vercel.app</a>.</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
