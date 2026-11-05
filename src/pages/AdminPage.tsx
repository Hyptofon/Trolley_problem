import React, { useState, useEffect, useCallback } from 'react';
import { checkAdminSession, loginAdmin } from '../services/api';
import { AdminLoginForm } from '../components/admin/AdminLoginForm';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const verifySession = useCallback(async () => {
    try {
      const res = await checkAdminSession();
      setIsAuthenticated(res.authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const handleLogin = async (password: string) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await loginAdmin({ password });
      if (res.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Невірний пароль доступу.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Не вдалося виконати вхід.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isCheckingSession) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center text-graphite-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-trolley-amber" />
        <p className="text-sm">Перевірка сесії адміністратора...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] flex flex-col justify-center">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLoginForm
          onLogin={handleLogin}
          isLoading={isLoggingIn}
          errorMessage={loginError}
        />
      )}
    </main>
  );
};

