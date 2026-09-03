import { NextResponse } from "next/server";
import { getSupabaseRestConfig } from "../../lib/supabase-server";

const TABLE = "se_records_latest";
const cacheSeconds = 60;

function parseContentRange(value) {
  const match = String(value || "").match(/\/(\\d+|\*)$/);
  return match && match[1] !== "*" ? Number(match[1]) : 0;
}

async function countRows(params = {}) {
  const { url, key } = getSupabaseRestConfig();
  const target = new URL(`${url}/rest/v1/${TABLE}`);
  target.searchParams.set("select", "id");
  target.searchParams.set("limit", "1");

  for (const [name, value] of Object.entries(params)) {
    target.searchParams.set(name, value);
  }

  const response = await fetch(target, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase HTTP ${response.status}: ${(await response.text()).slice(0, 800)}`);
  }

  return parseContentRange(response.headers.get("content-range"));
}

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": `s-maxage=${cacheSeconds}, stale-while-revalidate=300`,
    },
  });
}

export async function GET() {
  try {
    const [
      total,
      withGeo,
      withoutGeo,
      approved,
      submitted,
      rejected,
      draft,
      matched,
      notMatched,
    ] = await Promise.all([
      countRows(),
      countRows({ geotag_latitude: "not.is.null", geotag_longitude: "not.is.null" }),
      countRows({ or: "(geotag_latitude.is.null,geotag_longitude.is.null)" }),
      countRows({ status_assignment: "ilike.*APPROVED*" }),
      countRows({ status_assignment: "ilike.*SUBMITTED*" }),
      countRows({ status_assignment: "ilike.*REJECTED*" }),
      countRows({ status_assignment: "ilike.*DRAFT*" }),
      countRows({ mapping_status: "ilike.MATCHED" }),
      countRows({ mapping_status: "not.ilike.MATCHED" }),
    ]);

    const mappedPct = total ? Number(((withGeo / total) * 100).toFixed(1)) : 0;

    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      kpi: {
        total_records: total,
        mapped_records: withGeo,
        unmapped_records: withoutGeo,
        mapped_percentage: mappedPct,
      },
      status: { approved, submitted, rejected, draft },
      mapping: { matched, not_matched: notMatched },
      insights: [
        `${withGeo.toLocaleString("id-ID")} latest records memiliki koordinat dan siap dipetakan.`,
        `${withoutGeo.toLocaleString("id-ID")} latest records tidak memiliki geotag; data tetap disimpan karena koordinat kosong dapat valid secara operasional.`,
        `Cakupan geotag saat ini ${mappedPct}%.`,
      ],
    });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error?.message || "Gagal memuat dashboard." }, 500);
  }
}
