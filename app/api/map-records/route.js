import { NextResponse } from "next/server";
import { getSupabaseRestConfig } from "../../lib/supabase-server";

const MAX_POINTS = 5000;
const SELECT = [
  "id", "id_subsls", "status_assignment", "nama_petugas", "username_petugas",
  "peran_petugas", "geotag_accuracy", "geotag_latitude", "geotag_longitude",
  "jenis_prelist", "is_new_label", "kode_bang_label", "no_bang", "assignment_id",
  "nama_kepala_keluarga", "nama_usaha", "assignment_date_modified", "source_row_id",
  "petugas_ppl", "pml", "mapping_status"
].join(",");

function clean(value) {
  return String(value ?? "").trim();
}

export async function GET(request) {
  try {
    const { url, key } = getSupabaseRestConfig();
    const input = new URL(request.url);
    const target = new URL(`${url}/rest/v1/se_records_latest`);

    target.searchParams.set("select", SELECT);
    target.searchParams.set("limit", String(MAX_POINTS));
    target.searchParams.set("order", "id.asc");
    target.searchParams.set("geotag_latitude", "not.is.null");
    target.searchParams.set("geotag_longitude", "not.is.null");

    const bbox = ["south", "north", "west", "east"].map((key) => Number(input.searchParams.get(key)));
    if (bbox.every(Number.isFinite)) {
      target.searchParams.set("geotag_latitude", `gte.${bbox[0]}`);
      target.searchParams.append("geotag_latitude", `lte.${bbox[1]}`);
      target.searchParams.set("geotag_longitude", `gte.${bbox[2]}`);
      target.searchParams.append("geotag_longitude", `lte.${bbox[3]}`);
    }

    const status = clean(input.searchParams.get("status"));
    const ppl = clean(input.searchParams.get("ppl"));
    const prelist = clean(input.searchParams.get("prelist"));
    const search = clean(input.searchParams.get("search"));

    if (status) target.searchParams.set("status_assignment", `ilike.*${status.replaceAll("*", "")}*`);
    if (ppl) target.searchParams.set("petugas_ppl", `ilike.*${ppl.replaceAll("*", "")}*`);
    if (prelist) target.searchParams.set("jenis_prelist", `ilike.*${prelist.replaceAll("*", "")}*`);
    if (search) {
      const q = search.replaceAll(",", " ").replaceAll("*", "");
      target.searchParams.set("or", `(id_subsls.ilike.*${q}*,nama_kepala_keluarga.ilike.*${q}*,nama_usaha.ilike.*${q}*,petugas_ppl.ilike.*${q}*,pml.ilike.*${q}*)`);
    }

    const response = await fetch(target, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    const body = await response.text();
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: body.slice(0, 1200) }, { status: response.status });
    }

    const rows = JSON.parse(body);
    return NextResponse.json({ ok: true, rows, truncated: rows.length >= MAX_POINTS, limit: MAX_POINTS });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Gagal memuat titik map." }, { status: 500 });
  }
}
