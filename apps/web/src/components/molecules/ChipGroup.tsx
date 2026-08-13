import { useState } from 'react';
import { cn } from '../ui.js';
import { Button } from '../ui.js';

interface ChipGroupProps {
  readonly options: string[];
  readonly selected: string[];
  readonly onChange: (selected: string[]) => void;
  readonly tone?: 'brand' | 'slate';
  readonly allowCustom?: boolean;
}

const CUSTOM_ENTRY_MAX = 40;

type ChipTone = 'brand' | 'slate';

const TONES: Record<ChipTone, { on: string; off: string; add: string; input: string }> = {
  brand: {
    on: 'border-indigo-500/60 bg-indigo-50 text-indigo-700',
    off: 'border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-700',
    add: 'border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600',
    input: 'border-indigo-300 bg-white text-slate-900 placeholder:text-slate-400',
  },
  slate: {
    on: 'border-slate-400 bg-slate-100 text-slate-700',
    off: 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800',
    add: 'border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700',
    input: 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400',
  },
};

export function ChipGroup({
  options,
  selected,
  onChange,
  tone = 'brand',
  allowCustom = false,
}: ChipGroupProps): React.ReactElement {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const palette = TONES[tone];

  function reset(): void {
    setAdding(false);
    setDraft('');
    setError('');
  }

  function toggleChip(value: string): void {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function commit(): void {
    const value = draft.trim().replace(/\s+/g, ' ');
    if (!value) {
      setError('Enter a name first.');
      return;
    }
    if (value.length > CUSTOM_ENTRY_MAX) {
      setError(`Keep it under ${CUSTOM_ENTRY_MAX} characters.`);
      return;
    }

    // Case- and spacing-insensitive duplicate check
    const existing = [...options, ...selected].find(
      (option) => option.toLowerCase() === value.toLowerCase(),
    );
    if (existing) {
      // Already known — select it rather than refusing
      if (!selected.includes(existing)) {
        toggleChip(existing);
      }
      reset();
      return;
    }

    // Add the custom value
    onChange([...selected, value]);
    reset();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleChip(option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                isSelected ? palette.on : palette.off,
              )}
            >
              {isSelected ? '✓ ' : ''}
              {option}
            </button>
          );
        })}

        {allowCustom &&
          (adding ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border py-0.5 pl-3 pr-1',
                palette.input,
              )}
            >
              <input
                autoFocus
                type="text"
                value={draft}
                maxLength={CUSTOM_ENTRY_MAX + 10}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commit();
                  }
                  if (event.key === 'Escape') reset();
                }}
                onBlur={() => (draft.trim() ? commit() : reset())}
                placeholder="New entry"
                aria-label="New entry"
                aria-invalid={Boolean(error)}
                className={cn(
                  'w-40 bg-transparent text-xs focus:outline-none border-0',
                  tone === 'brand' ? 'text-indigo-700' : 'text-slate-700',
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={commit}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-semibold',
                  tone === 'brand'
                    ? 'text-indigo-600 hover:bg-indigo-50'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Add
              </Button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                palette.add,
              )}
            >
              + New
            </button>
          ))}
      </div>

      {error && (
        <p
          className={cn(
            'text-xs',
            tone === 'brand' ? 'text-rose-600' : 'text-rose-600',
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
}
