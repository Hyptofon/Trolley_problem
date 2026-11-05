import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-graphite-850 border border-graphite-700 flex items-center justify-center text-trolley-amber mb-4 shadow">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">404 — Сторінку не знайдено</h1>
      <p className="text-graphite-400 max-w-md mb-6 text-sm sm:text-base">
        Запитувана сторінка не існує або була переміщена. У проєкті доступні лише дилема та панель організатора.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-trolley-amber hover:bg-amber-500 text-graphite-950 font-bold text-sm transition-colors shadow"
      >
        <Home className="w-4 h-4" />
        <span>Повернутися до дилеми</span>
      </Link>
    </main>
  );
};

