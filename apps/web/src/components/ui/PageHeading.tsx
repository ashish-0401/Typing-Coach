interface PageHeadingProps {
  title: string;
  subtitle?: string;
}

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className="mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
    </div>
  );
}
