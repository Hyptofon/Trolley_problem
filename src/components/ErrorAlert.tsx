'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div
      role="alert"
      data-testid="error-alert"
      className="w-full max-w-4xl mx-auto my-4 p-4 sm:p-5 rounded-xl bg-red-950/40 border border-red-700/80 shadow-lg text-red-200 animate-fadeIn"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white">Не вдалося зберегти голос</h4>
            <p className="text-sm text-red-300 mt-0.5">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Повторна спроба...' : 'Спробувати ще раз'}</span>
        </button>
      </div>
    </div>
  );
};

