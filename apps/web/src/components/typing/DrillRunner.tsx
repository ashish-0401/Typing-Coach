import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, X } from 'lucide-react';
import { createSession } from '../../lib/api';
import type { GeneratedExercise } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import {
  calculateAccuracy,
  calculateWpm,
  countCharStats,
  diffInput,
  findMistypedWords,
} from '../../typing/metrics';
import { Button } from '../ui/Button';
import { Results } from './Results';
import type { SessionResult, WpmSample } from './Results';

interface CaretPosition {
  left: number;
  top: number;
  height: number;
}

/**
 * Runs a generated drill in place using the same typing surface and results
 * panel as the Practice test, but for a fixed passage: no config bar, no "next
 * test", and Tab restarts the same drill. Completed drills are saved (tagged
 * "drill") so they are distinguishable in history.
 */
export function DrillRunner({
  exercise,
  onExit,
}: {
  exercise: GeneratedExercise;
  onExit: () => void;
}) {
  const target = exercise.text;
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();

  const inputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caret, setCaret] = useState<CaretPosition>({ left: 0, top: 0, height: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [resizeTick, setResizeTick] = useState(0);
  const [capsLock, setCapsLock] = useState(false);

  const totalRef = useRef(0);
  const correctRef = useRef(0);
  const backspacesRef = useRef(0);
  const typedRef = useRef('');
  const samplesRef = useRef<WpmSample[]>([]);
  const lastSecondRef = useRef(0);
  const prevIncorrectRef = useRef(0);
  const doneRef = useRef(false);
  const savedRef = useRef(false);

  const isComplete = result !== null;
  const isActive = startTime !== null && !isComplete;

  useEffect(() => {
    totalRef.current = totalKeystrokes;
    correctRef.current = correctKeystrokes;
    backspacesRef.current = backspaces;
    typedRef.current = typed;
  }, [totalKeystrokes, correctKeystrokes, backspaces, typed]);

  const saveMutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['learning-profile'] });
    },
  });

  // Save a completed drill for logged-in users, tagged so history can tell it
  // apart from a normal test.
  useEffect(() => {
    if (result && user && !savedRef.current) {
      savedRef.current = true;
      saveMutation.mutate({
        wpm: Math.round(result.wpm),
        accuracy: Number(result.accuracy.toFixed(1)),
        backspaces: result.backspaces,
        mistakes: result.mistypedWords,
        tags: ['drill'],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, user]);

  const finalize = useCallback(
    (durationMs: number) => {
      if (doneRef.current) {
        return;
      }
      doneRef.current = true;
      const text = typedRef.current;
      const stats = countCharStats(target, text);

      const finalT = Math.max(1, Math.round(durationMs / 1000));
      const cumulativeIncorrect = totalRef.current - correctRef.current;
      const trailingErrors = Math.max(
        0,
        cumulativeIncorrect - prevIncorrectRef.current,
      );
      prevIncorrectRef.current = cumulativeIncorrect;
      const finalSample: WpmSample = {
        t: finalT,
        wpm: Math.round(calculateWpm(correctRef.current, durationMs)),
        raw: Math.round(calculateWpm(totalRef.current, durationMs)),
        errors: trailingErrors,
      };
      const samples = samplesRef.current;
      const last = samples[samples.length - 1];
      if (last && last.t === finalT) {
        samples[samples.length - 1] = {
          t: finalT,
          wpm: finalSample.wpm,
          raw: finalSample.raw,
          errors: last.errors + trailingErrors,
        };
      } else {
        samples.push(finalSample);
      }

      setResult({
        wpm: calculateWpm(correctRef.current, durationMs),
        accuracy: calculateAccuracy(correctRef.current, totalRef.current),
        backspaces: backspacesRef.current,
        correctChars: stats.correct,
        incorrectChars: stats.incorrect,
        mistypedWords: findMistypedWords(target, text),
        durationMs,
        testType: 'drill',
        samples: [...samplesRef.current],
      });
    },
    [target],
  );

  // Sample wpm per second while typing (drills end when fully typed, not on time).
  useEffect(() => {
    if (!isActive || startTime === null) {
      return;
    }
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const second = Math.floor(elapsed / 1000);
      if (second > lastSecondRef.current) {
        lastSecondRef.current = second;
        const cumulativeIncorrect = totalRef.current - correctRef.current;
        const errors = Math.max(
          0,
          cumulativeIncorrect - prevIncorrectRef.current,
        );
        prevIncorrectRef.current = cumulativeIncorrect;
        samplesRef.current.push({
          t: second,
          wpm: Math.round(calculateWpm(correctRef.current, elapsed)),
          raw: Math.round(calculateWpm(totalRef.current, elapsed)),
          errors,
        });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [isActive, startTime]);

  // Position the caret + scroll the lines to follow the active character.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const textEl = textRef.current;
    if (!viewport || !textEl) {
      return;
    }
    const index = Math.min(typed.length, target.length - 1);
    const el = charRefs.current[index];
    if (!el) {
      return;
    }
    const lineHeight = el.offsetHeight || 1;
    setScrollOffset(Math.max(0, el.offsetTop - lineHeight));
    const charRect = el.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const atEnd = typed.length >= target.length;
    setCaret({
      left: (atEnd ? charRect.right : charRect.left) - viewportRect.left,
      top: charRect.top - viewportRect.top,
      height: charRect.height,
    });
  }, [typed, target, resizeTick]);

  useEffect(() => {
    function handleResize() {
      setResizeTick((tick) => tick + 1);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const focusInput = useCallback(() => {
    if (!doneRef.current) {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    function handleKeydown(event: WindowEventMap['keydown']) {
      setCapsLock(event.getModifierState('CapsLock'));
      if (!doneRef.current && !isFocused) {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
        }
        focusInput();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isFocused, focusInput]);

  const restart = useCallback(() => {
    doneRef.current = false;
    savedRef.current = false;
    samplesRef.current = [];
    lastSecondRef.current = 0;
    prevIncorrectRef.current = 0;
    charRefs.current = [];
    setTyped('');
    setStartTime(null);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setBackspaces(0);
    setScrollOffset(0);
    setResult(null);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (isComplete) {
      return;
    }
    let next = event.target.value;
    if (next.length > target.length) {
      next = next.slice(0, target.length);
    }

    const now = Date.now();
    if (startTime === null) {
      setStartTime(now);
    }

    const delta = diffInput(target, typed, next);
    const newTotal = totalKeystrokes + delta.added;
    const newCorrect = correctKeystrokes + delta.addedCorrect;
    const newBackspaces = backspaces + delta.backspaces;

    setTotalKeystrokes(newTotal);
    setCorrectKeystrokes(newCorrect);
    setBackspaces(newBackspaces);
    setTyped(next);

    // The drill ends when the whole passage is typed.
    if (next.length >= target.length) {
      const durationMs = now - (startTime ?? now);
      typedRef.current = next;
      correctRef.current = newCorrect;
      totalRef.current = newTotal;
      backspacesRef.current = newBackspaces;
      finalize(durationMs);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();
      restart();
    }
  }

  const totalWords = target.split(' ').length;
  const typedWords =
    typed.length === 0
      ? 0
      : target.slice(0, typed.length).split(' ').filter(Boolean).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Drill
          </p>
          <h2 className="truncate font-heading text-xl font-semibold text-foreground">
            {exercise.title}
          </h2>
        </div>
        <Button variant="ghost" onClick={onExit} aria-label="Cancel drill">
          <X className="size-4" />
          Cancel
        </Button>
      </div>

      {!isComplete && (
        <>
          <div className="mb-4 flex h-8 items-center gap-3 font-mono text-2xl font-medium text-accent">
            {isActive ? `${typedWords}/${totalWords}` : ''}
          </div>

          {capsLock && (
            <div className="mb-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-lg bg-error/15 px-3 py-1.5 font-mono text-sm font-semibold text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m12 5 7 7H5l7-7Z" />
                  <rect x="5" y="16" width="14" height="3" rx="1" />
                </svg>
                Caps Lock
              </span>
            </div>
          )}

          <div
            className="relative cursor-text"
            onMouseDown={(e) => {
              e.preventDefault();
              focusInput();
            }}
          >
            <div
              ref={viewportRef}
              className="relative overflow-hidden"
              style={{ height: '7.8rem' }}
            >
              <div
                className={`typing-caret ${isActive && isFocused ? '' : 'typing-caret--idle'}`}
                style={{ left: caret.left, top: caret.top, height: caret.height }}
                aria-hidden
              />
              <div
                ref={textRef}
                className={
                  'relative select-none whitespace-pre-wrap break-words font-mono text-[1.6rem] ' +
                  'leading-[2.6rem] tracking-wide transition-[transform,filter,opacity] duration-150 ' +
                  (isFocused ? '' : 'blur-[3px] opacity-60')
                }
                style={{ transform: `translateY(-${scrollOffset}px)` }}
              >
                {target.split('').map((char, index) => {
                  let className = 'text-muted';
                  if (index < typed.length) {
                    className =
                      typed[index] === char
                        ? 'text-foreground'
                        : 'text-error underline decoration-error/60';
                  }
                  return (
                    <span
                      key={index}
                      className={className}
                      ref={(el) => {
                        charRefs.current[index] = el;
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>

              {!isFocused && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-xl border border-border bg-elevated/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur">
                    Click or press any key to focus
                  </span>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              value={typed}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isComplete}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              aria-label="Drill typing input"
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>

          <div className="mt-10 flex justify-center">
            <span className="font-mono text-xs text-muted">
              <kbd className="rounded border border-border px-1.5 py-0.5">Tab</kbd>{' '}
              to restart this drill
            </span>
          </div>
        </>
      )}

      {result && (
        <Results
          result={result}
          actions={
            <>
              <Button onClick={restart}>
                <RotateCcw className="size-4" />
                Restart drill
              </Button>
              <Button variant="secondary" onClick={onExit}>
                Done
              </Button>
            </>
          }
          footer={
            user ? (
              <span className="text-sm text-muted">
                {saveMutation.isError
                  ? 'Could not save this drill'
                  : saveMutation.isPending
                    ? 'Saving…'
                    : 'Saved to your history'}
              </span>
            ) : null
          }
        />
      )}
    </div>
  );
}
