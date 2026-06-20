import type { ReactNode } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeading } from '../components/ui/PageHeading';

const swatches: { name: string; className: string }[] = [
  { name: 'background', className: 'bg-background' },
  { name: 'card', className: 'bg-card' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'foreground', className: 'bg-foreground' },
  { name: 'muted', className: 'bg-muted' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function StyleGuidePage() {
  return (
    <>
      <PageHeading
        title="Style Guide"
        subtitle="The design system foundation: colors, typography and reusable primitives."
      />

      <Section title="Typography">
        <Card className="space-y-3">
          <h1 className="font-heading text-4xl font-semibold text-foreground">Lora heading</h1>
          <h2 className="font-heading text-2xl font-medium text-foreground">Calm, focused, modern</h2>
          <p className="max-w-2xl text-foreground">
            Body copy is set in Raleway. The product helps people practice deliberately and
            improve over time, with a clean flat-design aesthetic that stays out of the way.
          </p>
          <p className="text-muted">Muted text is used for secondary, supporting information.</p>
        </Card>
      </Section>

      <Section title="Colors">
        <div className="grid grid-cols-6 gap-4">
          {swatches.map((swatch) => (
            <div key={swatch.name} className="flex flex-col gap-2">
              <div className={`h-16 rounded-lg border border-border ${swatch.className}`} />
              <span className="text-sm text-muted">{swatch.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <Card className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </Card>
      </Section>

      <Section title="Inputs">
        <Card className="grid max-w-xl gap-4">
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
        </Card>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <h3 className="font-heading text-lg font-semibold text-foreground">Card title</h3>
            <p className="mt-1 text-muted">A simple surface for grouping related content.</p>
          </Card>
          <Card>
            <h3 className="font-heading text-lg font-semibold text-foreground">Flat design</h3>
            <p className="mt-1 text-muted">Subtle borders, minimal shadows, calm transitions.</p>
          </Card>
          <Card>
            <h3 className="font-heading text-lg font-semibold text-foreground">Light + dark</h3>
            <p className="mt-1 text-muted">Toggle the theme in the top bar to preview both.</p>
          </Card>
        </div>
      </Section>
    </>
  );
}
