'use client';
import { useAssignmentStore } from '@/store/assignmentStore';
import clsx from 'clsx';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function GenerationStatus() {
  const { generationStatus, generationProgress, generationMessage } = useAssignmentStore();

  if (!generationStatus || generationStatus === 'completed') return null;

  const isFailed = generationStatus === 'failed';

  return (
    <div className={clsx(
      'glass rounded-2xl p-6 border animate-fade-in',
      isFailed ? 'border-rose-500/30' : 'border-amber-500/30'
    )}>
      <div className="flex items-start gap-4">
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          isFailed ? 'bg-rose-500/10' : 'bg-amber-500/10'
        )}>
          {isFailed ? (
            <XCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-ink-100">
              {isFailed ? 'Generation Failed' : 'Generating Question Paper'}
            </p>
            {!isFailed && (
              <span className="text-xs text-amber-400 font-mono">{generationProgress}%</span>
            )}
          </div>

          <p className="text-xs text-ink-400 mb-3">{generationMessage}</p>

          {!isFailed && (
            <div className="w-full bg-ink-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {!isFailed && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['Structuring prompt', 'Calling AI model', 'Parsing & storing'].map((step, i) => {
            const done = generationProgress > (i + 1) * 30;
            const active = generationProgress > i * 30 && !done;
            return (
              <div key={step} className={clsx(
                'flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-lg',
                done ? 'text-emerald-400' : active ? 'text-amber-400' : 'text-ink-600'
              )}>
                {done ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                ) : active ? (
                  <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-ink-600 flex-shrink-0" />
                )}
                {step}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
