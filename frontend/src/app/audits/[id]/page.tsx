"use client";
import useSWR from "swr";
import { Container } from "@/components/ui/Container";
import { ReportHeader } from "@/components/report/ReportHeader";
import { SeverityBreakdown } from "@/components/report/SeverityBreakdown";
import { ViolationCard } from "@/components/report/ViolationCard";
import { API_URL, fetcher } from "@/lib/api";
import { copy } from "@/lib/copy";
import type { AuditDetail } from "@/lib/types";

const SEVERITY_WEIGHT = { critical: 0, serious: 1, moderate: 2, minor: 3 } as const;

export default function AuditDetailPage({ params }: { params: { id: string } }) {
  const { data, mutate } = useSWR<AuditDetail>(
    `${API_URL}/api/audits/${params.id}`,
    fetcher,
    { refreshInterval: 3000 }
  );

  if (!data) {
    return (
      <section className="py-24">
        <Container>
          <p className="text-muted">{copy.dashboard.statusProcessing}…</p>
        </Container>
      </section>
    );
  }

  if (data.status !== "done") {
    return (
      <section className="py-24">
        <Container className="flex flex-col gap-3">
          <h1 className="font-serif text-3xl text-ink">{data.url}</h1>
          <p className="text-muted">
            {copy.dashboard.tableStatus}: {data.status}
          </p>
        </Container>
      </section>
    );
  }

  async function reaudit() {
    await fetch(`${API_URL}/api/audits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: data!.url }),
    });
    mutate();
  }

  const totals = data.totals ?? { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const total =
    totals.critical + totals.serious + totals.moderate + totals.minor;

  const sorted = [...data.violations].sort(
    (a, b) => SEVERITY_WEIGHT[a.impact] - SEVERITY_WEIGHT[b.impact]
  );

  return (
    <section className="py-16">
      <Container className="flex flex-col gap-12">
        <ReportHeader
          url={data.url}
          score={data.score ?? 0}
          createdAt={data.createdAt}
          onReaudit={reaudit}
        />

        <div className="flex flex-col gap-6">
          <p className="max-w-prose text-lg text-ink/85">
            {copy.report.barriersSummary(total, totals.critical)}
          </p>
          <SeverityBreakdown totals={totals} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-ink">
            {copy.report.violationsTitle}
          </h2>
          {sorted.length === 0 ? (
            <p className="rounded border border-dashed border-line py-12 text-center text-muted">
              {copy.report.emptyViolations}
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {sorted.map((v) => (
                <li key={v.id}>
                  <ViolationCard violation={v} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
