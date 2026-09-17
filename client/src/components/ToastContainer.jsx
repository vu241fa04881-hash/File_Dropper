import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300'
                : isError
                ? 'bg-slate-900/90 border-rose-500/30 text-rose-300'
                : 'bg-slate-900/90 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {isInfo && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <p className="flex-1 text-xs sm:text-sm text-slate-100 font-medium leading-tight">
              {toast.message}
            </p>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
