"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import "../../smart-map/smart-map.css";

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="map-loading">Memuat Smart Map…</div>,
});

export default function SmartMap() {
  const [status, setStatus] = useState("");
  const [ppl, setPpl] = useState("");
  const [prelist, setPrelist] = useState("");
  const [search, setSearch] = useState("");

  function reset() {
    setStatus("");
    setPpl("");
    setPrelist("");
    setSearch("");
  }

  return (
    <main className="smart-map-page">
      <section className="smart-map-header">
        <div className="smart-map-eyebrow">GEOSPATIAL MONITORING</div>
        <h1>Smart Map</h1>
        <p>
          Peta current state dari <strong>se_records_latest</strong>. Hanya record dengan latitude dan longitude valid yang ditampilkan.
        </p>
      </section>

      <section className="smart-map-toolbar">
        <div className="smart-map-filters">
          <label>
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              <option value="APPROVED">APPROVED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </label>

          <label>
            <span>PPL</span>
            <input value={ppl} onChange={(e) => setPpl(e.target.value)} placeholder="Nama PPL" />
          </label>

          <label>
            <span>Jenis Prelist</span>
            <input value={prelist} onChange={(e) => setPrelist(e.target.value)} placeholder="Cari jenis prelist" />
          </label>

          <label>
            <span>Pencarian</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="IDSLS / kepala keluarga / usaha / PML" />
          </label>

          <button type="button" className="smart-map-mode-button" onClick={reset}>Reset</button>
        </div>
      </section>

      <section className="smart-map-content">
        <div className="smart-map-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="smart-map-panel-header">
            <div>
              <span>LIVE DATA</span>
              <h2>Sebaran Latest Records</h2>
            </div>
            <span className="smart-map-live">SUPABASE</span>
          </div>
          <div className="smart-map-container">
            <MapCanvas status={status} ppl={ppl} prelist={prelist} search={search} />
          </div>
        </div>
      </section>
    </main>
  );
}
