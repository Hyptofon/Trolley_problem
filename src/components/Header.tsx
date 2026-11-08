'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className="w-full border-b border-graphite-800 bg-graphite-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-white hover:text-trolley-amber transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-graphite-850 border border-graphite-700 flex items-center justify-center text-trolley-amber group-hover:border-trolley-amber/60 transition-colors">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 18h12" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight block leading-tight">
              Проблема вагонетки
            </span>
            <span className="text-xs text-graphite-400 block leading-tight">
              Класичний етичний експеримент
            </span>
          </div>
        </Link>

        <nav aria-label="Головна навігація" className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg bg-graphite-800 hover:bg-graphite-700 text-graphite-200 hover:text-white border border-graphite-700 transition-colors"
            >
              ← До дилеми
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg bg-graphite-900 hover:bg-graphite-800 text-graphite-300 hover:text-white border border-graphite-750 hover:border-graphite-600 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-graphite-400" />
              <span>Організатор</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
