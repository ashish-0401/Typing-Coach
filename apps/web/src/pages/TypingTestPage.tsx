import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Results } from '../components/typing/Results';
import type { SessionResult, WpmSample } from '../components/typing/Results';
import { useAuth } from '../lib/auth';
import { createSession, type Milestone } from '../lib/api';
import { milestoneLabel, pickTopMilestone } from '../lib/milestones';
import { configTag } from '../lib/sessionTags';
import {
  calculateAccuracy,
  calculateWpm,
  countCharStats,
  diffInput,
  findMistypedWords,
} from '../typing/metrics';
import { generateWords } from '../typing/words';
import { fetchQuote, randomQuote } from '../typing/quotes';
import { useTypingConfig } from '../typing/config';
import type { Mode } from '../typing/config';
import { Toast } from '../components/ui/Toast';

const TIME_OPTIONS = [15, 30, 60] as const;
const WORD_OPTIONS = [10, 25, 50] as const;

interface CaretPosition {
  left: number;
  top: number;
  height: number;
}

function buildTarget(
  mode: Mode,
  timeSec: number,
  wordCount: number,
  punctuation: boolean,
  numbers: boolean,
): string {
  if (mode === 'quote') {
    return randomQuote();
  }
  return mode === 'time'
    ? generateWords(Math.max(60, timeSec * 3), { punctuation, numbers })
    : generateWords(wordCount, { punctuation, numbers });
}

export function TypingTestPage() {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  const navState = location.state as {
    justSignedUp?: boolean;
    justLoggedIn?: boolean;
  } | null;
  const justSignedUp = navState?.justSignedUp ?? false;
  const justLoggedIn = navState?.justLoggedIn ?? false;
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const queryClient = useQueryClient();
  const [milestoneToast, setMilestoneToast] = useState<Milestone | null>(null);
  const saveMutation = useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['learning-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      const top = pickTopMilestone(data.newMilestones);
      if (top) {
        setMilestoneToast(top);
      }
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
  const punctuation = useTypingConfig((s) => s.punctuation);
  const numbers = useTypingConfig((s) => s.numbers);
  const setMode = useTypingConfig((s) => s.setMode);
  const setTimeSec = useTypingConfig((s) => s.setTimeSec);
  const setWordCount = useTypingConfig((s) => s.setWordCount);
  const setPunctuation = useTypingConfig((s) => s.setPunctuation);
  const setNumbers = useTypingConfig((s) => s.setNumbers);

  // Session
  const [target, setTarget] = useState<string>(() => {
    const c = useTypingConfig.getState();
    return buildTarget(
      c.mode,
      c.timeSec,
      c.wordCount,
      c.punctuation,
      c.numbers,
    );
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
  const [loadingPassage, setLoadingPassage] = useState(false);

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
  const quoteReqRef = useRef(0);
  const didInitQuote = useRef(false);

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
        tags: [configTag(mode, timeSec, wordCount)],
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
        testType:
          mode === 'time'
            ? `time ${timeSec}s`
            : mode === 'words'
              ? `words ${wordCount}`
              : 'quote',
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
      // When the input has lost focus (overlay showing), the first key should only
      // refocus, not type or start the test. Swallow it unless it's a browser shortcut.
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

  // Quote mode loads a bundled quote (resolves instantly).
  const startQuote = useCallback(async () => {
    const reqId = (quoteReqRef.current += 1);
    setLoadingPassage(true);
    const passage = await fetchQuote();
    if (quoteReqRef.current !== reqId) {
      return;
    }
    setLoadingPassage(false);
    startSession(passage, false);
  }, [startSession]);

  // On arriving already in quote mode, load a fresh quote.
  useEffect(() => {
    if (!didInitQuote.current && useTypingConfig.getState().mode === 'quote') {
      didInitQuote.current = true;
      void startQuote();
    }
  }, [startQuote]);

  const nextTest = useCallback(() => {
    if (mode === 'quote') {
      void startQuote();
      return;
    }
    startSession(
      buildTarget(mode, timeSec, wordCount, punctuation, numbers),
      false,
    );
  }, [
    startSession,
    startQuote,
    mode,
    timeSec,
    wordCount,
    punctuation,
    numbers,
  ]);

  const repeatTest = useCallback(() => {
    startSession(target, true);
  }, [startSession, target]);

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    if (nextMode === 'quote') {
      void startQuote();
      return;
    }
    startSession(
      buildTarget(nextMode, timeSec, wordCount, punctuation, numbers),
      false,
    );
  }

  function chooseAmount(value: number) {
    if (mode === 'time') {
      setTimeSec(value);
      startSession(
        buildTarget('time', value, wordCount, punctuation, numbers),
        false,
      );
    } else {
      setWordCount(value);
      startSession(
        buildTarget('words', timeSec, value, punctuation, numbers),
        false,
      );
    }
  }

  function togglePunctuation() {
    const next = !punctuation;
    setPunctuation(next);
    startSession(
      buildTarget(mode, timeSec, wordCount, next, numbers),
      false,
    );
  }

  function toggleNumbers() {
    const next = !numbers;
    setNumbers(next);
    startSession(
      buildTarget(mode, timeSec, wordCount, punctuation, next),
      false,
    );
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

    // Words and quote modes complete when the whole passage is typed.
    if (mode !== 'time' && next.length >= target.length) {
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
      {(justSignedUp || justLoggedIn) && user && !welcomeDismissed && (
        <Toast
          onClose={() => setWelcomeDismissed(true)}
          message={
            <>
              {justSignedUp ? 'Welcome aboard, ' : 'Welcome back, '}
              <span className="font-semibold">{user.name}</span>
              {justSignedUp
                ? '. Start your first test below.'
                : '. Ready for a warm-up?'}
            </>
          }
        />
      )}
      {milestoneToast && (
        <Toast
          onClose={() => setMilestoneToast(null)}
          message={
            <>
              New milestone:{' '}
              <span className="font-semibold">{milestoneLabel(milestoneToast)}</span>
            </>
          }
        />
      )}
      {!isComplete && (
        <>
          {/* Config bar */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 px-2 py-1.5 font-mono text-sm shadow-md backdrop-blur-sm">
              <TabButton active={mode === 'time'} onClick={() => chooseMode('time')}>
                time
              </TabButton>
              <TabButton active={mode === 'words'} onClick={() => chooseMode('words')}>
                words
              </TabButton>
              <TabButton active={mode === 'quote'} onClick={() => chooseMode('quote')}>
                quote
              </TabButton>
              {mode !== 'quote' && (
                <>
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
                  <span className="mx-2 h-5 w-px bg-border" />
                  <TabButton active={punctuation} onClick={togglePunctuation}>
                    punctuation
                  </TabButton>
                  <TabButton active={numbers} onClick={toggleNumbers}>
                    numbers
                  </TabButton>
                </>
              )}
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

              {!isFocused && !loadingPassage && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-xl border border-border bg-elevated/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur">
                    Click or press any key to focus
                  </span>
                </div>
              )}

              {loadingPassage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <span className="font-mono text-sm text-muted">
                    Loading a quote...
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
              disabled={isComplete || loadingPassage}
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
          actions={
            <>
              <button
                type="button"
                onClick={nextTest}
                title="Next test"
                aria-label="Next test"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-elevated text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <button
                type="button"
                onClick={repeatTest}
                title="Repeat test (same words)"
                aria-label="Repeat test"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-elevated text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            </>
          }
          footer={
            user ? (
              <span className="text-sm text-muted">
                {saveMutation.isError
                  ? 'Could not save this session'
                  : saveMutation.isPending
                    ? 'Saving…'
                    : 'Saved to your history'}
              </span>
            ) : (
              <Link
                to="/register"
                className="text-sm font-medium text-accent hover:underline"
              >
                Sign up to save your results
              </Link>
            )
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
        'rounded-lg px-3 py-1.5 transition-colors duration-200 cursor-pointer ' +
        (active
          ? 'bg-elevated text-accent shadow-sm'
          : 'text-muted hover:text-foreground')
      }
    >
      {children}
    </button>
  );
}
