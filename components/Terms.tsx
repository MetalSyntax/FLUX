import React from 'react';
import { UserSettings } from '../types';

interface TermsProps {
  settings: UserSettings;
}

const Terms: React.FC<TermsProps> = ({ settings }) => {
  const lang = settings.language || 'en';

  if (lang === 'es') {
    return (
      <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-black tracking-tight mb-2">Términos y Condiciones</h1>
          <p className="text-xs opacity-40 font-medium">Última actualización: Junio 2026</p>
        </div>

        <div className="glass rounded-3xl p-6 border border-ui-border space-y-6 text-sm opacity-80 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-primary mb-2">1. Introducción</h2>
            <p>Bienvenido a FLUX. Al utilizar nuestra aplicación, aceptas estos Términos y Condiciones. Por favor, léelos atentamente antes de usar la app.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">2. Almacenamiento Local</h2>
            <p>FLUX está diseñada como una aplicación web progresiva local-first. Todos tus libros, progreso de lectura y ajustes se almacenan localmente en tu dispositivo a través de IndexedDB. No alojamos, respaldamos ni sincronizamos los datos de tu biblioteca personal con ningún servidor externo.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">3. Contenido de Terceros</h2>
            <p>La sección "Explorar" de FLUX se conecta a APIs públicas externas como Project Gutenberg. No nos hacemos responsables del contenido, los derechos de autor o la disponibilidad de los libros descargados a través de estos servicios de terceros.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">4. Responsabilidad del Usuario</h2>
            <p>Eres el único responsable del contenido que subes a tu biblioteca. Por favor, asegúrate de tener el derecho legal para leer y almacenar los archivos EPUB, PDF y CBR que añadas a la aplicación.</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold text-primary mb-2">5. Responsabilidad Limitada</h2>
            <p>FLUX se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de ninguna pérdida de datos. Recomendamos encarecidamente exportar copias de seguridad de tu biblioteca JSON periódicamente mediante la vista de Ajustes.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">6. Desarrollador y Contacto</h2>
            <p>FLUX es diseñado y mantenido por MetalSyntax. Para obtener más información, actualizaciones o ver otros proyectos, visita mi portafolio en <a href="https://metalsyntax.vercel.app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">metalsyntax.vercel.app</a>.</p>
          </section>
        </div>
      </div>
    );
  }

  if (lang === 'pt') {
    return (
      <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-black tracking-tight mb-2">Termos e Condições</h1>
          <p className="text-xs opacity-40 font-medium">Última atualização: Junho 2026</p>
        </div>

        <div className="glass rounded-3xl p-6 border border-ui-border space-y-6 text-sm opacity-80 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-primary mb-2">1. Introdução</h2>
            <p>Bem-vindo ao FLUX. Ao usar nosso aplicativo, você concorda com estes Termos e Condições. Leia-os com atenção antes de usar o aplicativo.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">2. Armazenamento Local</h2>
            <p>O FLUX foi projetado como um aplicativo web progressivo local-first. Todos os seus livros, progresso de leitura e configurações são armazenados localmente no seu dispositivo via IndexedDB. Não hospedamos, fazemos backup ou sincronizamos os dados de sua biblioteca pessoal com servidores externos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">3. Conteúdo de Terceiros</h2>
            <p>A seção "Explorar" do FLUX se conecta a APIs públicas externas, como o Project Gutenberg. Não somos responsáveis pelo conteúdo, status de direitos autorais ou disponibilidade de livros baixados por meio desses serviços de terceiros.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">4. Responsabilidade do Usuário</h2>
            <p>Você é o único responsável pelo conteúdo que envia para sua biblioteca. Certifique-se de ter o direito legal de ler e armazenar os arquivos EPUB, PDF e CBR que adicionar ao aplicativo.</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold text-primary mb-2">5. Isenção de Responsabilidade</h2>
            <p>O FLUX é fornecido "como está", sem garantias de qualquer tipo. Não somos responsáveis por qualquer perda de dados. Recomendamos fortemente exportar backups de sua biblioteca JSON periodicamente por meio da tela de Configurações.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-primary mb-2">6. Desenvolvedor e Contato</h2>
            <p>O FLUX é projetado e mantido por MetalSyntax. Para obter mais informações, atualizações ou ver outros projetos, visite meu portfólio em <a href="https://metalsyntax.vercel.app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">metalsyntax.vercel.app</a>.</p>
          </section>
        </div>
      </div>
    );
  }

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
