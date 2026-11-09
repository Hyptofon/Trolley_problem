import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import NotFound from '@/app/not-found';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Layout Components & 404', () => {
  it('renders Header with wordmark and theme toggle', () => {
    render(<Header />);

    expect(screen.getByText('Проблема вагонетки')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /перемкнути на/i })).toBeInTheDocument();
  });

  it('renders Footer with experiment notes', () => {
    render(<Footer />);

    expect(
      screen.getByText(/Анонімне навчальне голосування/i)
    ).toBeInTheDocument();
  });

  it('renders 404 NotFound page with link back to dilemma', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: /404 — Сторінку не знайдено/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Повернутися до дилеми/i })).toBeInTheDocument();
  });
});
