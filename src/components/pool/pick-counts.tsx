import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PoolPickCounts } from "@/lib/pick-counts";

type Props = {
  data: PoolPickCounts;
};

export function PickCounts({ data }: Props) {
  return (
    <div className="space-y-5">
      <Card className="border-brand/20 bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-4xl uppercase text-brand">
            Pick Counts
          </CardTitle>
          <CardDescription>
            {data.name} - {data.seasonLabel} - {data.entrantCount}{" "}
            {data.entrantCount === 1 ? "entrant" : "entrants"}
          </CardDescription>
        </CardHeader>
      </Card>

      {data.boxes.length === 0 && (
        <p className="text-sm text-muted-foreground">No boxes configured for this pool yet.</p>
      )}

      {data.boxes.map((box) => (
        <Card key={box.id} className="border-brand/20 bg-card">
          <CardHeader>
            <CardTitle>
              Box {box.boxOrder}: {box.title}
            </CardTitle>
            <CardDescription>
              {box.totalPicks} of {data.entrantCount} entrants picked this box
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {box.options.length === 0 && (
              <p className="text-sm text-muted-foreground">No player options configured yet.</p>
            )}

            {box.options.map((option) => {
              const share = box.totalPicks > 0 ? option.pickCount / box.totalPicks : 0;
              const percent = Math.round(share * 100);
              const barColor = option.player.team?.primaryColorHex ?? "#22D3EE";

              return (
                <div
                  key={option.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-2 text-sm text-foreground"
                >
                  {option.player.team?.logoUrl ? (
                    <img
                      src={option.player.team.logoUrl}
                      alt={`${option.player.team.name} logo`}
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                  ) : (
                    <span className="h-8 w-8 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-semibold">
                        {option.player.firstName} {option.player.lastName} ({option.player.position})
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">{option.pickCount}</span>
                        {" "}
                        ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share * 100}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
