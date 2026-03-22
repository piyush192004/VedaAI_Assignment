import clsx from 'clsx';
import { Difficulty } from '@/types';

const config: Record<Difficulty, { label: string; classes: string }> = {
  easy: { label: 'Easy', classes: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  medium: { label: 'Medium', classes: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  hard: { label: 'Hard', classes: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
};

export default function DifficultyBadge({ difficulty, size = 'sm' }: { difficulty: Difficulty; size?: 'xs' | 'sm' }) {
  const { label, classes } = config[difficulty] || config.medium;
  return (
    <span className={clsx(
      'inline-flex items-center border rounded-full font-semibold tracking-wide',
      size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
      classes
    )}>
      {label}
    </span>
  );
}
