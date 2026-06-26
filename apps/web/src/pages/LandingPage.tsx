import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'motion/react';
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  LineChart,
  Sparkles,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ThemeToggle } from '../components/ThemeToggle';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Marquee } from '../components/ui/Marquee';
import { ScrambleText } from '../components/ui/ScrambleText';
import { Sparkline } from '../components/ui/Sparkline';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { AnimatedNumber } from '../components/ui/motion';

const EASE = [0.22, 1, 0.36, 1] as const;

function LandingNav() {
  const user = useAuth((s) => s.user);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-foreground">Waza</span>
          <span className="text-accent">Key</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/practice">Start typing</Link>
              </Button>
            </>
          )}
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
    <div className="grid grid-cols-2 items-center gap-12">
      <motion.div
        initial={{ opacity: 0, x: flip ? 48 : -48 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.6, ease: EASE }}
        className={flip ? 'order-2' : ''}
      >
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
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: flip ? -48 : 48, scale: 0.96 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
        className={flip ? 'order-1' : ''}
      >
        {visual}
      </motion.div>
    </div>
  );
}

export function LandingPage() {
  const user = useAuth((s) => s.user);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Reading-progress bar. */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-40 h-0.75 origin-left bg-linear-to-r from-accent via-primary to-accent"
      />
      <LandingNav />

      {/* Hero */}
      <section className="relative isolate mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24">
        {/* Ambient color glows that breathe for depth. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 -z-10 size-136 rounded-full bg-primary/25 blur-[120px]"
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.12, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-24 -z-10 size-104 rounded-full bg-accent/20 blur-[110px]"
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
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
          <span className="text-gradient-hero block drop-shadow-[0_4px_30px_rgba(139,128,249,0.35)]">
            <ScrambleText text="keyboard." speed={0.8} />
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-foreground/80"
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
          <Button asChild size="lg" className="group hover:-translate-y-0.5">
            <Link to="/practice">
              {user ? 'Start typing' : 'Start typing free'}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="hover:-translate-y-0.5"
          >
            <Link to={user ? '/dashboard' : '/login'}>
              {user ? 'Go to dashboard' : 'Log in'}
            </Link>
          </Button>
        </motion.div>
        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
            className="mt-5 text-sm text-muted"
          >
            New here?{' '}
            <Link
              to="/register"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Create a free account
            </Link>
          </motion.p>
        )}

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
                  <p className="bg-linear-to-br from-accent to-primary bg-clip-text font-mono text-5xl font-bold tabular-nums text-transparent">
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
