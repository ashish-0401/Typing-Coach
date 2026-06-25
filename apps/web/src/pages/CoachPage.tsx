import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCoachMessages, sendCoachMessage } from '../lib/api';
import type { CoachMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

const SUGGESTIONS = [
  'How am I doing?',
  'What should I practice next?',
  'What is my biggest weakness?',
];

const MAX_MESSAGE = 1000;

function Bubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          'max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm ' +
          (isUser
            ? 'bg-accent/15 text-foreground'
            : 'border border-border bg-elevated text-foreground')
        }
      >
        {message.content}
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
      // Keep what they typed so they can retry.
      setInput(sentText);
      setPending(null);
    },
  });

  // Keep the thread scrolled to the newest message.
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
        subtitle="Ask about your progress, weak spots, or what to practice next."
      />

      <Card className="flex flex-col p-0">
        <div
          ref={threadRef}
          className="max-h-[58vh] min-h-[40vh] space-y-4 overflow-y-auto px-6 py-5"
        >
          {isPending ? (
            <p className="text-muted">Loading your conversation…</p>
          ) : isError ? (
            <p className="text-error">{error.message}</p>
          ) : thread.length === 0 ? (
            <div className="py-8 text-center">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Your typing coach
              </h2>
              <p className="mt-1 text-sm text-muted">
                Ask anything about your progress. Try one of these:
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => pickSuggestion(question)}
                    className="cursor-pointer rounded-full border border-border bg-elevated px-3 py-1.5 text-sm text-muted transition-colors duration-200 hover:text-foreground"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            thread.map((message, index) => (
              <Bubble key={index} message={message} />
            ))
          )}

          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-muted">
                Coach is typing…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          {mutation.isError && (
            <p className="mb-2 text-sm text-error">{mutation.error.message}</p>
          )}
          <form onSubmit={submit} className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              maxLength={MAX_MESSAGE}
              placeholder="Ask your coach…"
              aria-label="Message your coach"
              className="flex-1 resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Button type="submit" disabled={!canSend}>
              Send
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
