interface PageHeroProps {
  title: string;
}

export function PageHero({ title }: PageHeroProps) {
  return (
    <section className="pt-12 pb-[38px] md:pt-24 md:pb-[86px] lg:pt-32 lg:pb-[118px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              {title}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Welcome to your {title.toLowerCase()} page. This is a placeholder that you can
              customize.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
