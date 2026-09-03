import { NextResponse } from "next/server";
import { getSupabaseRestConfig } from "../../lib/supabase-server";

async function count(params = {}) {
  const { url, key } = getSupabaseRestConfig();
  const target = new URL(`${url}/rest/v1/se_records_latest`);
  target.searchParams.set("select", "id");
  target.searchParams.set("limit", "1");
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  const response = await fetch(target, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}: ${(await response.text()).slice(0, 800)}`);
  const match = String(response.headers.get("content-range") || "").match(/\/(\d+|\*)$/);
  return match && match[1] !== "*" ? Number(match[1]) : 0;
}

export async function GET() {
  try {
    const [total, missingGeo, missingAssignment, missingPpl, matched] = await Promise.all([
      count(),
      count({ or: "(geotag_latitude.is.null,geotag_longitude.is.null)" }),
      count({ assignment_id: "is.null" }),
      count({ petugas_ppl: "is.null" }),
      count({ mapping_status: "ilike.MATCHED" }),
    ]);

    const findings = [
      { anomaly_id: "GEO-001", nama_anomali: "Koordinat belum tersedia", kategori: "Spasial", level: "Info", jumlah_temuan: missingGeo, assignment_terdampak: missingGeo, deskripsi_rule: "Latitude atau longitude kosong pada latest record." },
      { anomaly_id: "ID-001", nama_anomali: "Assignment ID kosong", kategori: "Administratif", level: "Sedang", jumlah_temuan: missingAssignment, assignment_terdampak: missingAssignment, deskripsi_rule: "Latest record tidak memiliki assignment_id." },
      { anomaly_id: "MAP-001", nama_anomali: "PPL belum terpetakan", kategori: "Administratif", level: "Info", jumlah_temuan: missingPpl, assignment_terdampak: missingPpl, deskripsi_rule: "Kolom petugas_ppl kosong." },
    ];

    return NextResponse.json({
      ok: true,
      totals: {
        total_temuan: findings.reduce((sum, row) => sum + row.jumlah_temuan, 0),
        assignment_terdampak: missingGeo + missingAssignment + missingPpl,
        jenis_anomali: findings.length,
        multi_anomaly_assignment: 0,
      },
      top_anomalies: findings,
      anomalies: findings,
      status_assignment: [],
      meta: { total_latest: total, mapping_matched: matched },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Gagal memuat kualitas data." }, { status: 500 });
  }
}
