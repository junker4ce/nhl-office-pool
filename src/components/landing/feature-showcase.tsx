import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Feature = {
  title: string;
  description: string;
  eyebrow: string;
};

const features: Feature[] = [
  {
    eyebrow: "01",
    title: "Set up the office pool",
    description:
      "Admins define the season window and the single office pool structure before entrants begin picking.",
  },
  {
    eyebrow: "02",
    title: "Build player box options",
    description:
      "Each box can carry multiple player options so entrants can make a single pick per category.",
  },
  {
    eyebrow: "03",
    title: "Join and submit picks",
    description:
      "Entrants can join the office pool, choose one option per box, and update their picks before lock.",
  },
  {
    eyebrow: "04",
    title: "Score from NHL stats",
    description:
      "The next phase will ingest NHL game data and convert picks into points for a full standings view.",
  },
];

export function FeatureShowcase() {
  return (
    <div className="space-y-4 rounded-3xl border border-brand/25 bg-card p-6 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.35)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand/80">
          What is included
        </p>
        <h2 className="font-heading text-4xl uppercase text-brand">
          MVP experience
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="border-brand/20 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-[0.2em] text-brand/80">
                {feature.eyebrow}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
