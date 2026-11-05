import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

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
    <div className="w-full max-w-md mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-graphite-900 border border-graphite-700/80 shadow-2xl">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-graphite-800 border border-graphite-700 flex items-center justify-center text-trolley-amber mb-3 shadow">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Вхід для організатора</h2>
        <p className="text-sm text-graphite-400 mt-1">
          Введіть пароль для доступу до повної статистики голосування
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700/80 text-red-200 text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="admin-password-input"
            className="block text-xs uppercase tracking-wider font-semibold text-graphite-300 mb-2"
          >
            Пароль доступу
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-graphite-500">
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
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-graphite-950 border border-graphite-700 text-white placeholder-graphite-500 focus:border-trolley-amber focus:ring-1 focus:ring-trolley-amber text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-graphite-400 hover:text-white"
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
          className="w-full py-2.5 px-4 rounded-xl bg-trolley-amber hover:bg-amber-500 text-graphite-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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

