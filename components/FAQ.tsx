import React from 'react';
import { UserSettings } from '../types';

interface FAQProps {
  settings: UserSettings;
}

const FAQ: React.FC<FAQProps> = ({ settings }) => {
  const lang = settings.language || 'en';

  const content = {
    es: {
      title: 'Preguntas Frecuentes & Glosario',
      subtitle: 'Respuestas a dudas comunes sobre el funcionamiento técnico de FLUX y glosario de términos.',
      q1: '¿Qué formatos de libros y cómics soporta FLUX?',
      a1: 'FLUX soporta libros de texto en formato EPUB, documentos en formato PDF y archivos comprimidos de imágenes para cómics y mangas en formatos CBR, CBZ y ZIP.',
      q2: '¿Dónde se almacenan mis libros y progreso?',
      a2: 'Todos tus archivos y el historial de lectura se guardan localmente en tu dispositivo dentro del navegador usando IndexedDB. Tus archivos nunca salen de tu ordenador o teléfono.',
      q3: '¿FLUX requiere conexión a Internet para funcionar?',
      a3: 'No. Una vez cargada o instalada como PWA, FLUX funciona al 100% de manera offline (sin conexión a internet). Solo necesitas conexión si deseas buscar nuevos libros en la sección "Explorar".',
      q4: '¿Cómo puedo hacer una copia de seguridad de mis libros?',
      a4: 'Puedes ir a la pestaña Perfil, sección "Copia de Seguridad" y hacer clic en "Descargar Copia". Esto descargará un archivo JSON con tu historial, colecciones y configuraciones para restaurarlo cuando quieras.',
      q5: '¿Por qué FLUX es "privacy-first" (privacidad primero)?',
      a5: 'FLUX no tiene servidores propios, no requiere creación de cuentas ni utiliza rastreadores de analíticas de terceros. Tu biblioteca de lectura es completamente privada y tuya.',
      glossaryTitle: 'Glosario Técnico',
      pwaTitle: 'PWA (Progressive Web App)',
      pwaDesc: 'Una aplicación web que se comporta como una aplicación nativa. Permite la instalación en pantalla de inicio, inicio offline y acceso rápido.',
      indexeddbTitle: 'IndexedDB',
      indexeddbDesc: 'Una base de datos integrada en los navegadores modernos que permite guardar grandes cantidades de datos estructurados, incluyendo archivos binarios como tus libros.',
      epubTitle: 'EPUB',
      epubDesc: 'Formato estándar y redimensionable de libros digitales que se adapta dinámicamente a la pantalla del dispositivo.',
      cbrcbzTitle: 'CBR / CBZ',
      cbrcbzDesc: 'Formatos populares para cómics y mangas que consisten en una secuencia de imágenes (JPEG/PNG) empaquetadas en archivos comprimidos RAR (CBR) o ZIP (CBZ).'
    },
    pt: {
      title: 'Perguntas Frequentes & Glossário',
      subtitle: 'Respostas a dúvidas comuns sobre o funcionamento técnico do FLUX e glossário de termos.',
      q1: 'Quais formatos de livros e quadrinhos o FLUX suporta?',
      a1: 'O FLUX suporta e-books no formato EPUB, documentos no formato PDF e arquivos de imagens compactados para mangás e quadrinhos nos formatos CBR, CBZ e ZIP.',
      q2: 'Onde meus livros e progresso são armazenados?',
      a2: 'Todos os seus arquivos e histórico de leitura são salvos localmente no seu dispositivo através do banco de dados interno do navegador (IndexedDB). Seus arquivos nunca saem do seu aparelho.',
      q3: 'O FLUX precisa de conexão com a Internet para funcionar?',
      a3: 'Não. Depois de carregado ou instalado como PWA, o FLUX funciona 100% offline. Você só precisa de internet para buscar novos livros na aba "Explorar".',
      q4: 'Como posso fazer backup da minha biblioteca?',
      a4: 'Você pode ir na aba Perfil, na seção de "Backup e Restauração" e clicar em "Baixar Backup" para exportar suas configurações, coleções e progresso em formato JSON.',
      q5: 'Por que o FLUX é "privacy-first" (privacidade primeiro)?',
      a5: 'O FLUX não tem servidores, não exige criação de contas e não usa rastreadores de terceiros. Sua privacidade é absoluta e garantida pelo armazenamento local.',
      glossaryTitle: 'Glossário Técnico',
      pwaTitle: 'PWA (Progressive Web App)',
      pwaDesc: 'Aplicativo web que se comporta como nativo, permitindo instalação na tela inicial, carregamento offline e alto desempenho.',
      indexeddbTitle: 'IndexedDB',
      indexeddbDesc: 'Banco de dados interno do navegador para armazenar grandes volumes de dados, como os arquivos binários dos seus livros.',
      epubTitle: 'EPUB',
      epubDesc: 'Formato padrão e fluido para livros digitais que adapta o tamanho do texto dinamicamente à tela.',
      cbrcbzTitle: 'CBR / CBZ',
      cbrcbzDesc: 'Formatos populares para quadrinhos e mangás que consistem em imagens (JPEG/PNG) compactadas em arquivos RAR (CBR) ou ZIP (CBZ).'
    },
    en: {
      title: 'Frequently Asked Questions & Glossary',
      subtitle: 'Answers to common questions about the technical operation of FLUX and glossary of terms.',
      q1: 'What book and comic formats does FLUX support?',
      a1: 'FLUX supports e-books in EPUB format, documents in PDF format, and compressed image archives for comics and manga in CBR, CBZ, and ZIP formats.',
      q2: 'Where are my books and reading progress stored?',
      a2: 'All your files and reading history are saved locally on your device within the browser using IndexedDB. Your files never leave your computer or phone.',
      q3: 'Does FLUX require an internet connection to work?',
      a3: 'No. Once loaded or installed as a PWA, FLUX works 100% offline. You only need a connection if you want to discover new books in the "Explore" section.',
      q4: 'How can I back up my reading library?',
      a4: 'You can go to the Profile tab, look for the "Backup & Restore" section, and click "Download Backup". This downloads a JSON file containing your history, collections, and preferences.',
      q5: 'Why is FLUX privacy-first?',
      a5: 'FLUX has no cloud servers, requires no user accounts, and does not use third-party tracking scripts. Your library is completely private and remains under your control.',
      glossaryTitle: 'Technical Glossary',
      pwaTitle: 'PWA (Progressive Web App)',
      pwaDesc: 'A web application that behaves like a native app. It allows home screen installation, offline start, and fast access.',
      indexeddbTitle: 'IndexedDB',
      indexeddbDesc: 'An integrated database in modern web browsers that allows storing large amounts of structured data, including binary files like your books.',
      epubTitle: 'EPUB',
      epubDesc: 'A standard reflowable digital book format that dynamically adapts to the screen of the device.',
      cbrcbzTitle: 'CBR / CBZ',
      cbrcbzDesc: 'Popular formats for comics and manga consisting of a sequence of images (JPEG/PNG) packaged in RAR (CBR) or ZIP (CBZ) compressed archives.'
    }
  };

  const t = content[lang] || content.en;

  const faqs = [
    { q: t.q1, a: t.a1 },
    { q: t.q2, a: t.a2 },
    { q: t.q3, a: t.a3 },
    { q: t.q4, a: t.a4 },
    { q: t.q5, a: t.a5 }
  ];

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-black tracking-tight mb-2">{t.title}</h1>
        <p className="text-xs opacity-60 font-medium">{t.subtitle}</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <details key={idx} name="flux-faq" className="glass rounded-3xl border border-ui-border overflow-hidden transition-all duration-300 group [&[open]]:bg-ui-bg-accented">
            <summary className="px-6 py-4 font-bold text-sm cursor-pointer select-none flex items-center justify-between list-none">
              <span>{faq.q}</span>
              <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-primary">
                keyboard_arrow_down
              </span>
            </summary>
            <div className="px-6 pb-5 pt-1 text-sm opacity-80 leading-relaxed border-t border-ui-border/20">
              <p>{faq.a}</p>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-black tracking-tight mb-4">{t.glossaryTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: t.pwaTitle, desc: t.pwaDesc },
            { title: t.indexeddbTitle, desc: t.indexeddbDesc },
            { title: t.epubTitle, desc: t.epubDesc },
            { title: t.cbrcbzTitle, desc: t.cbrcbzDesc }
          ].map((item, idx) => (
            <div key={idx} className="glass rounded-3xl p-6 border border-ui-border space-y-2">
              <h3 className="text-sm font-bold text-primary">{item.title}</h3>
              <p className="text-xs opacity-75 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
