import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/index.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Проблема вагонетки — Етична дилема',
  description:
    'Інтерактивна навчальна дилема «Проблема вагонетки» — анонімне голосування та етичний експеримент.',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0d12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-graphite-950 text-graphite-100 antialiased min-h-screen flex flex-col selection:bg-trolley-amber/30 selection:text-trolley-amber`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-trolley-amber focus:text-graphite-950 focus:font-bold focus:rounded-lg focus:shadow-xl"
        >
          Перейти до основного вмісту
        </a>

        <Header />

        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>

        <Footer />
      </body>
    </html>
  );
}
