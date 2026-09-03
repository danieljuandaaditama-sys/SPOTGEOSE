"use client";
import { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("id-ID");

export default function KpiCards() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard-summary", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body.ok) throw new Error(body.error || "Gagal memuat dashboard.");
        return body;
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="small-insight"><span>SMART INSIGHT</span><p>{error}</p></div>;

  const kpi = data?.kpi;
  const cards = [
    ["TOTAL LATEST", fmt(kpi?.total_records), "Current state per assignment"],
    ["SIAP DIPETAKAN", fmt(kpi?.mapped_records), `${kpi?.mapped_percentage ?? 0}% memiliki koordinat`],
    ["TANPA GEOTAG", fmt(kpi?.unmapped_records), "Tetap disimpan sebagai data valid"],
    ["MAPPING MATCHED", fmt(data?.mapping?.matched), "Record dengan PPL terpetakan"],
  ];

  return <div className="kpi-grid">
    {cards.map(([title, value, desc], i) => (
      <article key={title} className={`kpi-card ${i === 0 ? "primary" : ""}`}>
        <div className="kpi-top"><div className="kpi-label">{title}</div><div className="kpi-icon">{["▦","⌖","○","✓"][i]}</div></div>
        <div className="kpi-value">{data ? value : "…"}</div>
        <div className={i === 0 ? "kpi-description" : "target-label"}>{desc}</div>
      </article>
    ))}
  </div>;
}
