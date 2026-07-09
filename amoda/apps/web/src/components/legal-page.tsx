export function LegalPage({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updatedAt}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
