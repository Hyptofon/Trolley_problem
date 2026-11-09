import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/index.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SoundProvider } from '@/components/SoundProvider';
import { ExperimentProvider } from '@/components/ExperimentProvider';

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
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('trolley-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-paper text-obsidian antialiased min-h-screen flex flex-col selection:bg-obsidian selection:text-paper`}
      >
        <ThemeProvider>
          <SoundProvider>
            <ExperimentProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-6 focus:py-2 focus:bg-obsidian focus:text-paper focus:font-medium focus:text-xs focus:uppercase focus:tracking-widest"
              >
                Перейти до основного вмісту
              </a>

              <Header />

              <div id="main-content" className="flex-1 flex flex-col w-full">
                {children}
              </div>

              <Footer />
            </ExperimentProvider>
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

