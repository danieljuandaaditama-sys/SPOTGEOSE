import { NextResponse } from "next/server";
import { getSupabaseRestConfig } from "../../lib/supabase-server";

async function requestOne(order) {
  const { url, key } = getSupabaseRestConfig();
  const target = new URL(`${url}/rest/v1/se_records_latest`);
  target.searchParams.set("select", "geotag_latitude,geotag_longitude");
  target.searchParams.set("geotag_latitude", "not.is.null");
  target.searchParams.set("geotag_longitude", "not.is.null");
  target.searchParams.set("order", order);
  target.searchParams.set("limit", "1");

  const response = await fetch(target, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}: ${(await response.text()).slice(0, 800)}`);
  const rows = await response.json();
  return rows[0] || null;
}

export async function GET() {
  try {
    const [south, north, west, east] = await Promise.all([
      requestOne("geotag_latitude.asc"),
      requestOne("geotag_latitude.desc"),
      requestOne("geotag_longitude.asc"),
      requestOne("geotag_longitude.desc"),
    ]);

    return NextResponse.json({
      ok: true,
      bounds: {
        south: Number(south?.geotag_latitude),
        north: Number(north?.geotag_latitude),
        west: Number(west?.geotag_longitude),
        east: Number(east?.geotag_longitude),
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Gagal membaca bounds map." }, { status: 500 });
  }
}
