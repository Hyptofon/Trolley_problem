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
      className="w-full my-6 p-6 rounded-none border border-obsidian bg-obsidian/[0.03] text-obsidian animate-fadeIn"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-obsidian flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm sm:text-base text-obsidian uppercase tracking-wide font-mono">
              Помилка збереження вибору
            </h4>
            <p className="text-xs sm:text-sm text-felt-gray mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="btn-ghost-pill text-xs uppercase tracking-[0.15em] py-2.5 px-6 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Повторна спроба...' : 'Спробувати ще раз'}</span>
        </button>
      </div>
    </div>
  );
};
