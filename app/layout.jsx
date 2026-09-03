import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "SpotGeo SE",
  description: "WebGIS monitoring dan Smart Map Survei Ekonomi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">⌖</div>
            <div>
              <h1>SPOTGEO SE</h1>
              <span>WebGIS Monitoring Survei Ekonomi</span>
            </div>
          </div>
          <nav className="navigation" aria-label="Navigasi utama">
            <Link href="/">Dashboard</Link>
            <Link href="/smart-map">Smart Map</Link>
            <Link href="/data-se">Data SE</Link>
            <Link href="/kualitas-data">Kualitas Data</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
