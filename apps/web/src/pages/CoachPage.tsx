import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles } from 'lucide-react';
import { fetchCoachMessages, sendCoachMessage } from '../lib/api';
import type { CoachMessage } from '../lib/api';
import { cn } from '@/lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';
import { Textarea } from '../components/ui/Textarea';

const SUGGESTIONS = [
  'Why do I slow down on long words?',
  'How do I stop repeating the same mistakes?',
  'Should I push for speed or lock in accuracy?',
];

const MAX_MESSAGE = 1000;

function Bubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-accent ring-1 ring-primary/15">
          <Sparkles className="size-3.5" />
        </span>
      )}
      <div
        className={cn(
          'max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-elevated text-foreground',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-accent ring-1 ring-primary/15">
        <Sparkles className="size-3.5" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-elevated px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CoachPage() {
  const queryClient = useQueryClient();
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const {
    data: messages,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['coach', 'messages'],
    queryFn: fetchCoachMessages,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: sendCoachMessage,
    onSuccess: (assistantMessage, sentText) => {
      const userMessage: CoachMessage = {
        role: 'user',
        content: sentText,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<CoachMessage[]>(['coach', 'messages'], (old) => [
        ...(old ?? []),
        userMessage,
        assistantMessage,
      ]);
      setPending(null);
    },
    onError: (_err, sentText) => {
      setInput(sentText);
      setPending(null);
    },
  });

  useEffect(() => {
    const el = threadRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, pending, mutation.isPending]);

  const thread: CoachMessage[] = [
    ...(messages ?? []),
    ...(pending
      ? [{ role: 'user' as const, content: pending, createdAt: '' }]
      : []),
  ];
  const canSend = input.trim().length > 0 && !mutation.isPending;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || mutation.isPending) {
      return;
    }
    setInput('');
    setPending(text);
    mutation.mutate(text);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function pickSuggestion(question: string) {
    setInput(question);
    textareaRef.current?.focus();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="AI Coach"
        subtitle="Ask the open-ended questions a chart can't answer. Your coach knows your history."
      />

      <Card className="flex flex-col p-0">
        <div
          ref={threadRef}
          className="max-h-[58vh] min-h-[42vh] space-y-4 overflow-y-auto px-6 py-5"
        >
          {isPending ? (
            <p className="text-muted">Loading your conversation...</p>
          ) : isError ? (
            <p className="text-error">{error.message}</p>
          ) : thread.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="animate-float flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/30 to-accent/10 text-accent shadow-glow ring-1 ring-primary/30">
                <Sparkles className="size-6" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
                Your typing coach
              </h2>
              <p className="mt-1 text-sm text-muted">
                Numbers live on your Dashboard and Plan. Here, ask the why and
                how. Try one:
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => pickSuggestion(question)}
                    className="cursor-pointer rounded-full border border-border bg-elevated px-3.5 py-1.5 text-sm text-muted transition-colors duration-200 hover:border-primary/40 hover:text-foreground"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            thread.map((message, index) => <Bubble key={index} message={message} />)
          )}

          {mutation.isPending && <TypingDots />}
        </div>

        <div className="border-t border-border px-6 py-4">
          {mutation.isError && (
            <p className="mb-2 text-sm text-error">{mutation.error.message}</p>
          )}
          <form onSubmit={submit} className="flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              maxLength={MAX_MESSAGE}
              placeholder="Ask your coach..."
              aria-label="Message your coach"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              aria-label="Send message"
              className="h-11 w-11 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted">
            Enter to send, Shift+Enter for a new line.
          </p>
        </div>
      </Card>
    </div>
  );
}
