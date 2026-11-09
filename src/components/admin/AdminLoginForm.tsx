'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginFormProps {
  onLogin: (password: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;
    await onLogin(password);
  };

  return (
    <div className="w-full max-w-md mx-auto my-16 p-8 sm:p-10 rounded-none border border-obsidian bg-paper shadow-none transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
      <div className="flex flex-col items-center text-center mb-8">
        <span className="w-2.5 h-2.5 bg-obsidian inline-block mb-3" />
        <span className="text-[11px] uppercase tracking-[0.25em] font-mono text-felt-gray mb-2 block">
          [ Захищений доступ ]
        </span>
        <h2 className="text-3xl sm:text-4xl font-light text-obsidian tracking-tight">Вхід для організатора</h2>
        <p className="text-xs text-felt-gray mt-2 leading-relaxed font-light">
          Введіть пароль для доступу до повної статистики голосування
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          data-testid="admin-login-error"
          className="mb-6 p-4 rounded-none border border-obsidian bg-obsidian/[0.03] text-obsidian text-xs font-mono flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-obsidian flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="admin-password-input"
            className="block text-[11px] uppercase tracking-[0.2em] font-mono text-felt-gray mb-2"
          >
            Пароль доступу
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-felt-gray">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="admin-password-input"
              data-testid="admin-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введіть пароль..."
              required
              autoFocus
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-3 rounded-none bg-paper border border-obsidian/30 text-obsidian placeholder-felt-gray focus:border-obsidian focus:outline-none text-sm transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-felt-gray hover:text-obsidian"
              aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          data-testid="admin-login-submit"
          disabled={isLoading || !password.trim()}
          className="btn-ghost-pill w-full py-3.5 text-xs uppercase tracking-[0.2em] bg-obsidian text-paper hover:bg-paper hover:text-obsidian disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Перевірка...</span>
            </>
          ) : (
            <span>Увійти до панелі</span>
          )}
        </button>
      </form>
    </div>
  );
};
