interface PageHeadingProps {
  title: string;
  subtitle?: string;
}

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className="mb-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}
