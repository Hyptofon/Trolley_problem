import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-graphite-850 py-8 text-center text-xs text-graphite-400 mt-auto">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          Навчальний інтерактивний сайт на основі мисленнєвого експерименту Філіппи Фут (1967) та Джудіт Джарвіс Томсон.
        </p>
        <p className="text-graphite-400 font-mono">
          Анонімне навчальне голосування
        </p>
      </div>
    </footer>
  );
};

