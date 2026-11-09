'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-obsidian/10 bg-paper py-12 px-6 sm:px-12 md:px-16 mt-auto transition-colors duration-700">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] leading-[1.36] text-felt-gray font-normal">
        {/* Left Column: Context */}
        <div className="space-y-1">
          <p className="text-obsidian uppercase tracking-[0.2em] mb-2 font-medium">Контекст експерименту</p>
          <p>Мисленнєвий моральний експеримент Філіппи Фут (1967).</p>
          <p>Модифікація Джудіт Джарвіс Томсон (1976).</p>
        </div>

        {/* Center Column: Privacy */}
        <div className="space-y-1">
          <p className="text-obsidian uppercase tracking-[0.2em] mb-2 font-medium">Конфіденційність</p>
          <p>Анонімне навчальне голосування та дослідження.</p>
          <p>Жодних персональних даних, IP-адрес чи трекерів.</p>
        </div>

        {/* Right Column: Engine */}
        <div className="space-y-1 md:text-right">
          <p className="text-obsidian uppercase tracking-[0.2em] mb-2 font-medium">Архітектура</p>
          <p>Next.js 14 · TypeScript · Upstash Redis</p>
          <p className="text-obsidian">© 2026 Проблема вагонетки</p>
        </div>
      </div>
    </footer>
  );
};
