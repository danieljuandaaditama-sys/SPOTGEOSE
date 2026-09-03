"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MAX_POINTS = 5000;
const fmt = (v) => Number(v || 0).toLocaleString("id-ID");

function BoundsLoader({ onBounds }) {
  useMapEvents({
    moveend(event) {
      onBounds(event.target.getBounds());
    },
  });
  return null;
}

function FitBounds({ bounds, onFitted }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    const values = [bounds.south, bounds.north, bounds.west, bounds.east];
    if (!values.every(Number.isFinite)) return;
    const leafletBounds = [[bounds.south, bounds.west], [bounds.north, bounds.east]];
    map.fitBounds(leafletBounds, { padding: [24, 24], maxZoom: 15 });
    const timer = setTimeout(() => onFitted?.(map.getBounds()), 250);
    return () => clearTimeout(timer);
  }, [bounds, map, onFitted]);
  return null;
}

export default function MapCanvas({ status = "", ppl = "", prelist = "", search = "", height = "100%" }) {
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [hasLoadedViewport, setHasLoadedViewport] = useState(false);
  const firstViewport = useRef(null);
  const currentViewport = useRef(null);
  const filterTimer = useRef(null);

  async function load(bounds) {
    const params = new URLSearchParams();
    if (bounds) {
      params.set("south", String(bounds.getSouth()));
      params.set("north", String(bounds.getNorth()));
      params.set("west", String(bounds.getWest()));
      params.set("east", String(bounds.getEast()));
    }
    if (status) params.set("status", status);
    if (ppl.trim()) params.set("ppl", ppl.trim());
    if (prelist.trim()) params.set("prelist", prelist.trim());
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/map-records?${params.toString()}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "Gagal memuat marker.");
      setRows(body.rows || []);
      setTruncated(Boolean(body.truncated));
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/map-meta", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body.ok) throw new Error(body.error || "Gagal membaca area map.");
        return body;
      })
      .then((body) => { if (!cancelled) setMeta(body.bounds); })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const handleBounds = (bounds) => {
    currentViewport.current = bounds;
    if (!hasLoadedViewport) setHasLoadedViewport(true);
    load(bounds);
  };

  useEffect(() => {
    if (!hasLoadedViewport || !currentViewport.current) return;
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => load(currentViewport.current), 250);
    return () => clearTimeout(filterTimer.current);
  }, [status, ppl, prelist, search]);

  const center = meta && Number.isFinite(meta.south) && Number.isFinite(meta.north)
    ? [(meta.south + meta.north) / 2, (meta.west + meta.east) / 2]
    : [0, 0];

  const rememberFittedBounds = (bounds) => {
    if (!currentViewport.current) currentViewport.current = bounds;
  };

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      {error && (
        <div style={{ position: "absolute", zIndex: 1000, top: 12, left: 12, right: 12, padding: 10, borderRadius: 8, background: "#fff1f2", color: "#be123c", fontSize: 12 }}>
          {error}
        </div>
      )}
      <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }} preferCanvas>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds bounds={meta} onFitted={rememberFittedBounds} />
        <BoundsLoader onBounds={handleBounds} />
        {rows.map((r) => (
          <CircleMarker key={r.id} center={[Number(r.geotag_latitude), Number(r.geotag_longitude)]} radius={5} pathOptions={{ weight: 1, fillOpacity: 0.75 }}>
            <Popup>
              <div style={{ minWidth: 240, fontSize: 12, lineHeight: 1.5 }}>
                <strong>{r.id_subsls || "Record SE"}</strong><br />
                Status: {r.status_assignment || "—"}<br />
                PPL: {r.petugas_ppl || "—"}<br />
                PML: {r.pml || "—"}<br />
                Prelist: {r.jenis_prelist || "—"}<br />
                Kepala Keluarga: {r.nama_kepala_keluarga || "—"}<br />
                Usaha: {r.nama_usaha || "—"}<br />
                Akurasi: {r.geotag_accuracy != null ? `${r.geotag_accuracy} m` : "—"}<br />
                <small>Assignment: {r.assignment_id || "—"}</small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div style={{ position: "absolute", zIndex: 900, bottom: 12, left: 12, padding: "7px 10px", background: "rgba(255,255,255,.94)", borderRadius: 8, fontSize: 11, color: "#475569", boxShadow: "0 2px 8px rgba(15,23,42,.12)" }}>
        {loading ? "Memuat…" : `${fmt(rows.length)} titik tampil`}{truncated ? " · zoom/persempit area untuk melihat lebih banyak" : ""}
      </div>
    </div>
  );
}
