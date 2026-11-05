import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../src/App';
import * as api from '../../src/services/api';

describe('App Layout & Routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders homepage at root path "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Проблема вагонетки/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Організатор/i })).toBeInTheDocument();
  });

  it('renders admin page at "/admin"', async () => {
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: false });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Вхід для організатора/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /До дилеми/i })).toBeInTheDocument();
  });

  it('renders 404 NotFound page on unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/some-unknown-route']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /404 — Сторінку не знайдено/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Повернутися до дилеми/i })).toBeInTheDocument();
  });
});
