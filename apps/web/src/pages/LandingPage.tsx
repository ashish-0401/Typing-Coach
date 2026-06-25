import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Brain,
  LineChart,
  Sparkles,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Marquee } from '../components/ui/Marquee';
import { ScrambleText } from '../components/ui/ScrambleText';
import { Sparkline } from '../components/ui/Sparkline';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { AnimatedNumber, Reveal } from '../components/ui/motion';

const EASE = [0.22, 1, 0.36, 1] as const;

function LandingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/WazaKey.png"
            alt="WazaKey"
            className="h-9 w-9 rounded-lg ring-1 ring-border"
          />
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-foreground">Waza</span>
            <span className="text-accent">Key</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Button asChild size="sm">
            <Link to="/practice">Start typing</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Feature({
  index,
  icon: Icon,
  title,
  body,
  visual,
  flip,
}: {
  index: string;
  icon: LucideIcon;
  title: string;
  body: string;
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <Reveal>
      <div className="grid grid-cols-2 items-center gap-12">
        <div className={flip ? 'order-2' : ''}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted">{index}</span>
            <span className="h-px w-10 bg-border" />
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-accent ring-1 ring-primary/15">
              <Icon className="size-4" />
            </span>
          </div>
          <h3 className="mt-5 font-heading text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            {body}
          </p>
        </div>
        <div className={flip ? 'order-1' : ''}>{visual}</div>
      </div>
    </Reveal>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <LandingNav />

      {/* Hero */}
      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        >
          <Badge variant="accent" className="mb-6">
            <Sparkles className="size-3" /> AI typing coach
          </Badge>
        </motion.div>
        <h1 className="font-heading font-bold uppercase leading-[0.92] tracking-tight text-[clamp(3rem,9vw,7.5rem)]">
          <span className="block text-foreground">
            <ScrambleText text="Master your" />
          </span>
          <span className="block bg-gradient-to-br from-accent via-primary to-accent bg-clip-text text-transparent">
            <ScrambleText text="keyboard." speed={0.8} />
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-muted"
        >
          A typing trainer with an AI coach that remembers every session, finds
          the words that trip you up, and trains you to fix them.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.65 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Button asChild size="lg">
            <Link to="/practice">
              Start typing free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/register">Create account</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute inset-x-6 bottom-10 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted"
        >
          <ArrowDown className="size-3 animate-bounce" /> Scroll to explore
        </motion.div>
      </section>

      <Marquee
        items={[
          'Precision',
          'Speed',
          'Accuracy',
          'Consistency',
          'Rhythm',
          'Focus',
          'Flow',
        ]}
        className="border-y border-border/60 py-3"
      />

      {/* Features */}
      <section className="mx-auto max-w-6xl space-y-32 px-6 py-32">
        <Feature
          index="01"
          icon={Brain}
          title="A coach that remembers"
          body="Every session is saved forever. Your coach references real progress, like the weak keys you fixed last week, and pushes you on what is next."
          visual={
            <SpotlightCard>
              <div className="flex items-start gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-accent ring-1 ring-primary/15">
                  <Sparkles className="size-4" />
                </span>
                <p className="text-sm leading-relaxed text-foreground">
                  You are at 67 WPM, up from 58 two weeks ago. Accuracy is steady
                  at 92%. Want a 60-second drill on ie/ei words?
                </p>
              </div>
            </SpotlightCard>
          }
        />
        <Feature
          index="02"
          icon={Target}
          title="Find your weak spots"
          body="The AI reads your mistyped words and performance trends to name the exact patterns holding you back, and explains why."
          flip
          visual={
            <SpotlightCard>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Diagnosis
              </p>
              <p className="mt-2 text-base text-foreground">
                You struggle with ie/ei spelling.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['receive', 'believe', 'piece', 'committee'].map((word) => (
                  <Badge key={word} variant="mono">
                    {word}
                  </Badge>
                ))}
              </div>
            </SpotlightCard>
          }
        />
        <Feature
          index="03"
          icon={LineChart}
          title="Watch yourself improve"
          body="WPM and accuracy trends, personal bests, streaks, and milestones, all tracked so progress feels real and earned."
          visual={
            <SpotlightCard>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    Best WPM
                  </p>
                  <p className="bg-gradient-to-br from-accent to-primary bg-clip-text font-mono text-5xl font-bold tabular-nums text-transparent">
                    <AnimatedNumber value={81} />
                  </p>
                </div>
              </div>
              <div className="mt-4 h-14 w-full">
                <Sparkline
                  values={[52, 55, 58, 57, 63, 67, 72, 81]}
                  className="h-full w-full"
                />
              </div>
            </SpotlightCard>
          }
        />
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-32">
        <Reveal>
          <SpotlightCard className="overflow-hidden px-10 py-20 text-center">
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
            <h2 className="relative font-heading text-5xl font-bold tracking-tight text-foreground">
              Ready to type faster?
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-lg text-muted">
              No signup needed to try. Take a test and watch your coach get to
              work.
            </p>
            <Button asChild size="lg" className="relative mt-8">
              <Link to="/practice">
                Start typing now <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </SpotlightCard>
        </Reveal>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted">
          <span className="font-semibold tracking-tight">
            <span className="text-foreground">Waza</span>
            <span className="text-accent">Key</span>
          </span>
          <span className="font-mono text-xs uppercase tracking-widest">
            Your Typing Dojo
          </span>
        </div>
      </footer>
    </div>
  );
}
