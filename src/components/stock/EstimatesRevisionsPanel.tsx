"use client";

import type { FeatureAvailability } from "@/types";

interface Props {
  features: FeatureAvailability;
}

export function EstimatesRevisionsPanel({ features }: Props) {
  const available = features.estimatesAndRevisions;

  return (
    <div
      className="card p-5 space-y-3"
      style={{
        opacity: available ? 1 : 0.65,
      }}
      aria-disabled={!available}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Estimates &amp; Revisions Analystes
      </h3>

      {!available ? (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Non disponible: aucune source d’estimations / révisions n’est configurée.
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Cette section nécessite un provider dédié (consensus EPS N+1, révisions 30/90 jours, % analystes en hausse/baisse).
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Disponible (provider configuré). Implémentation à compléter.
        </p>
      )}
    </div>
  );
}

