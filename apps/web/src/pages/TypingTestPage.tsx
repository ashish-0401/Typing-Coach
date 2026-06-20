import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../lib/auth';
import { createSession } from '../lib/api';
import {
  calculateAccuracy,
  calculateWpm,
  countCharStats,
  diffInput,
  findMistypedWords,
} from '../typing/metrics';
import { generateWords } from '../typing/words';
import { useTypingConfig } from '../typing/config';
import type { Mode } from '../typing/config';

const TIME_OPTIONS = [15, 30, 60] as const;
const WORD_OPTIONS = [10, 25, 50] as const;

interface WpmSample {
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

interface SessionResult {
  wpm: number;
  accuracy: number;
  backspaces: number;
  correctChars: number;
  incorrectChars: number;
  mistypedWords: string[];
  durationMs: number;
  testType: string;
  samples: WpmSample[];
}

interface CaretPosition {
  left: number;
  top: number;
  height: number;
}

function buildTarget(mode: Mode, timeSec: number, wordCount: number): string {
  return mode === 'time'
    ? generateWords(Math.max(60, timeSec * 3))
    : generateWords(wordCount);
}

export function TypingTestPage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Config (persisted across sessions)
  const mode = useTypingConfig((s) => s.mode);
  const timeSec = useTypingConfig((s) => s.timeSec);
  const wordCount = useTypingConfig((s) => s.wordCount);
  const setMode = useTypingConfig((s) => s.setMode);
  const setTimeSec = useTypingConfig((s) => s.setTimeSec);
  const setWordCount = useTypingConfig((s) => s.setWordCount);

  // Session
  const [target, setTarget] = useState<string>(() => {
    const c = useTypingConfig.getState();
    return buildTarget(c.mode, c.timeSec, c.wordCount);
  });
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caret, setCaret] = useState<CaretPosition>({ left: 0, top: 0, height: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [resizeTick, setResizeTick] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Refs mirroring state for use inside the timer interval.
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

  // Persist a completed session for logged-in users (guests stay local-only).
  useEffect(() => {
    if (result && user && !savedRef.current) {
      savedRef.current = true;
      saveMutation.mutate({
        wpm: Math.round(result.wpm),
        accuracy: Number(result.accuracy.toFixed(1)),
        backspaces: result.backspaces,
        mistakes: result.mistypedWords,
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

      // Capture a final data point covering the last partial second.
      const finalT = Math.max(1, Math.round(durationMs / 1000));
      const cumulativeIncorrect = totalRef.current - correctRef.current;
      const trailingErrors = Math.max(0, cumulativeIncorrect - prevIncorrectRef.current);
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
        testType: mode === 'time' ? `time ${timeSec}s` : `words ${wordCount}`,
        samples: [...samplesRef.current],
      });
    },
    [target, mode, timeSec, wordCount],
  );

  // Live timer: tick, sample wpm per second, and end timed tests.
  useEffect(() => {
    if (!isActive || startTime === null) {
      return;
    }
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedMs(elapsed);

      const second = Math.floor(elapsed / 1000);
      if (second > lastSecondRef.current) {
        lastSecondRef.current = second;
        const cumulativeIncorrect = totalRef.current - correctRef.current;
        const errors = Math.max(0, cumulativeIncorrect - prevIncorrectRef.current);
        prevIncorrectRef.current = cumulativeIncorrect;
        samplesRef.current.push({
          t: second,
          wpm: Math.round(calculateWpm(correctRef.current, elapsed)),
          raw: Math.round(calculateWpm(totalRef.current, elapsed)),
          errors,
        });
      }

      if (mode === 'time' && elapsed >= timeSec * 1000) {
        finalize(timeSec * 1000);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [isActive, startTime, mode, timeSec, finalize]);

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

    // Keep one line above the active line visible.
    const lineHeight = el.offsetHeight || 1;
    const nextScroll = Math.max(0, el.offsetTop - lineHeight);
    setScrollOffset(nextScroll);

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
  }, [target, focusInput]);

  useEffect(() => {
    function handleKeydown(event: WindowEventMap['keydown']) {
      setCapsLock(event.getModifierState('CapsLock'));
      if (!isFocused) {
        focusInput();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isFocused, focusInput]);

  const startSession = useCallback((nextTarget: string, repeated: boolean) => {
    doneRef.current = false;
    savedRef.current = false;
    samplesRef.current = [];
    lastSecondRef.current = 0;
    prevIncorrectRef.current = 0;
    charRefs.current = [];
    setTarget(nextTarget);
    setIsRepeat(repeated);
    setTyped('');
    setStartTime(null);
    setElapsedMs(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setBackspaces(0);
    setScrollOffset(0);
    setResult(null);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const nextTest = useCallback(() => {
    startSession(buildTarget(mode, timeSec, wordCount), false);
  }, [startSession, mode, timeSec, wordCount]);

  const repeatTest = useCallback(() => {
    startSession(target, true);
  }, [startSession, target]);

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    startSession(buildTarget(nextMode, timeSec, wordCount), false);
  }

  function chooseAmount(value: number) {
    if (mode === 'time') {
      setTimeSec(value);
      startSession(buildTarget('time', value, wordCount), false);
    } else {
      setWordCount(value);
      startSession(buildTarget('words', timeSec, value), false);
    }
  }

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
      setElapsedMs(0);
    }

    const delta = diffInput(target, typed, next);
    const newTotal = totalKeystrokes + delta.added;
    const newCorrect = correctKeystrokes + delta.addedCorrect;
    const newBackspaces = backspaces + delta.backspaces;

    setTotalKeystrokes(newTotal);
    setCorrectKeystrokes(newCorrect);
    setBackspaces(newBackspaces);
    setTyped(next);

    // Words mode completes when the whole stream is typed.
    if (mode === 'words' && next.length >= target.length) {
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
      nextTest();
    }
  }

  const amountOptions = mode === 'time' ? TIME_OPTIONS : WORD_OPTIONS;
  const activeAmount = mode === 'time' ? timeSec : wordCount;

  const remaining = Math.max(0, timeSec - Math.floor(elapsedMs / 1000));
  const totalWords = target.split(' ').length;
  const typedWords = typed.length === 0 ? 0 : target.slice(0, typed.length).split(' ').filter(Boolean).length;

  return (
    <div className="mx-auto max-w-4xl">
      {!isComplete && (
        <>
          {/* Config bar */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center gap-1 rounded-lg bg-card px-2 py-1.5 font-mono text-sm">
              <TabButton active={mode === 'time'} onClick={() => chooseMode('time')}>
                time
              </TabButton>
              <TabButton active={mode === 'words'} onClick={() => chooseMode('words')}>
                words
              </TabButton>
              <span className="mx-2 h-5 w-px bg-border" />
              {amountOptions.map((value) => (
                <TabButton
                  key={value}
                  active={activeAmount === value}
                  onClick={() => chooseAmount(value)}
                >
                  {value}
                </TabButton>
              ))}
            </div>
          </div>

          {/* Live counter */}
          <div className="mb-4 flex h-8 items-center gap-3 font-mono text-2xl font-medium text-accent">
            {isActive
              ? mode === 'time'
                ? remaining
                : `${typedWords}/${totalWords}`
              : ''}
            {isRepeat && (
              <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-accent">
                repeated
              </span>
            )}
          </div>

          {/* Caps Lock warning */}
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

          {/* Typing surface */}
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
                  <span className="rounded-lg bg-card/80 px-4 py-2 text-sm font-medium text-muted backdrop-blur">
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
              aria-label="Typing input"
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>

          {/* Restart hint */}
          <div className="mt-10 flex justify-center">
            <span className="font-mono text-xs text-muted">
              <kbd className="rounded border border-border px-1.5 py-0.5">Tab</kbd> to restart
            </span>
          </div>
        </>
      )}

      {/* Results */}
      {result && (
        <Results
          result={result}
          onNext={nextTest}
          onRepeat={repeatTest}
          showSignup={!user}
          savedNote={
            user
              ? saveMutation.isError
                ? 'Could not save this session'
                : saveMutation.isPending
                  ? 'Saving…'
                  : 'Saved to your history'
              : null
          }
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md px-3 py-1 transition-colors duration-200 cursor-pointer ' +
        (active ? 'text-accent' : 'text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  );
}

function ResultStat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
      <span
        className={
          'font-mono font-semibold tabular-nums ' +
          (emphasis ? 'text-6xl text-accent' : 'text-3xl text-foreground')
        }
      >
        {value}
      </span>
    </div>
  );
}

function Results({
  result,
  onNext,
  onRepeat,
  showSignup,
  savedNote,
}: {
  result: SessionResult;
  onNext: () => void;
  onRepeat: () => void;
  showSignup: boolean;
  savedNote: string | null;
}) {
  const chartData = result.samples.map((s) => ({
    ...s,
    errorPoint: s.errors > 0 ? s.errors : null,
  }));

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-end gap-12">
        <ResultStat label="wpm" value={String(Math.round(result.wpm))} emphasis />
        <ResultStat label="accuracy" value={`${result.accuracy.toFixed(0)}%`} emphasis />
      </div>

      {result.samples.length > 1 && (
        <div className="mt-8">
          <div className="mb-2 flex items-center gap-4 font-mono text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> wpm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted" /> raw
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-error">&#10005;</span> errors
            </span>
          </div>
          <div className="h-44 w-full" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                accessibilityLayer={false}
              >
                <XAxis
                  dataKey="t"
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  unit="s"
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: 'var(--color-foreground)',
                  }}
                  labelFormatter={(t) => `${String(t)}s`}
                  formatter={(value, name) =>
                    name === 'errorPoint'
                      ? [`${String(value)}`, 'errors']
                      : [`${String(value)} wpm`, String(name)]
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="raw"
                  stroke="var(--color-muted)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wpm"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 2, fill: 'var(--color-accent)' }}
                  isAnimationActive={false}
                />
                <Scatter
                  yAxisId="right"
                  dataKey="errorPoint"
                  fill="var(--color-error)"
                  shape="cross"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <ResultStat label="test" value={result.testType} />
        <ResultStat
          label="characters"
          value={`${result.correctChars}/${result.incorrectChars}`}
        />
        <ResultStat label="backspaces" value={String(result.backspaces)} />
        <ResultStat label="time" value={`${(result.durationMs / 1000).toFixed(0)}s`} />
      </div>

      <div className="mt-8">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted">Mistyped words</h3>
        {result.mistypedWords.length === 0 ? (
          <p className="mt-2 text-muted">None. Clean run!</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {result.mistypedWords.map((word) => (
              <span
                key={word}
                className="rounded-md bg-error/10 px-2 py-1 font-mono text-sm text-error"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center gap-5">
        {/* Next test (first in tab order) */}
        <button
          type="button"
          onClick={onNext}
          title="Next test (new words)"
          aria-label="Next test"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-card text-muted transition-colors duration-200 hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        {/* Repeat test (second in tab order); reuses the same words */}
        <button
          type="button"
          onClick={onRepeat}
          title="Repeat test (same words)"
          aria-label="Repeat test"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-card text-muted transition-colors duration-200 hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        {showSignup && (
          <Link to="/register" className="text-sm font-medium text-accent hover:underline">
            Sign up to save your results
          </Link>
        )}
        {savedNote && <span className="text-sm text-muted">{savedNote}</span>}
      </div>
    </div>
  );
}
