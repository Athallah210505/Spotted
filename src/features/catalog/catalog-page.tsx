import Link from "next/link";
import Form from "next/form";
import { JourneyLayout } from "@/features/tiktok/journey-layout";
import shared from "@/features/tiktok/journey.module.css";
import { catalog, filterCatalog, kindLabels } from "./catalog";
import styles from "./catalog.module.css";
import { googleMapsUrl } from "./catalog-media";
import { CatalogPhoto } from "./catalog-photo";

const date = (value: string) =>
  new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

export function CatalogPage({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const result = filterCatalog(params);
  const addressed = catalog.places.filter((p) => p.address).length;
  const websites = catalog.places.filter((p) => p.website).length;
  const inspected = catalog.places.filter(
    (p) => p.websiteInspection?.status === "fetched",
  ).length;
  return (
    <JourneyLayout
      title="Data Jakarta"
      backHref="/explore"
      footer={
        <a
          className={styles.attribution}
          href={catalog.licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          © OpenStreetMap contributors · ODbL
        </a>
      }
    >
      <p className={shared.step}>PILOT DATA · BUKAN DATA CONTOH</p>
      <h1>
        Tempat nyata.
        <br />
        Sumber terbuka.
      </h1>
      <p className={`${shared.body} ${shared.muted}`}>
        {catalog.places.length} titik tempat makan dari {catalog.areas.length}{" "}
        area sampel. Ini bukan seluruh Jakarta dan belum diverifikasi pemilik
        usaha. Titik tanpa nama dan lokasi berbentuk polygon tidak masuk pilot.
      </p>
      <section className={styles.quality} aria-label="Kelengkapan snapshot">
        <h2>Kelengkapan data</h2>
        <p>
          {addressed}/{catalog.places.length} ada tag alamat · {websites}/
          {catalog.places.length} ada website
        </p>
        <p>
          {inspected} halaman website berhasil dibaca memakai Scrapling. Alamat
          bisa parsial; judul dan tautan menu belum membuktikan jam buka atau
          harga.
        </p>
        <p>
          Diambil {date(catalog.fetchedAt)} WIB. Halaman ini memakai snapshot di
          kode; tidak memanggil API berbayar.
        </p>
      </section>
      <Form
        action="/catalog"
        key={`${result.query}:${result.area}:${result.kind}`}
        className={shared.form}
        role="search"
        aria-label="Cari data tempat makan"
      >
        <label htmlFor="catalog-search" className={shared.label}>
          Cari nama, alamat, atau cuisine
        </label>
        <input
          id="catalog-search"
          type="search"
          name="q"
          defaultValue={result.query}
          maxLength={120}
          className={shared.input}
          placeholder="Contoh: Batavia"
        />
        <label className={shared.label} htmlFor="catalog-area">
          Area sampel
        </label>
        <select
          name="area"
          id="catalog-area"
          defaultValue={result.area}
          className={shared.input}
        >
          <option value="">Semua area sampel</option>
          {catalog.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.selectedCount} titik
            </option>
          ))}
        </select>
        <label className={shared.label} htmlFor="catalog-kind">
          Jenis tempat menurut OSM
        </label>
        <select
          name="kind"
          id="catalog-kind"
          defaultValue={result.kind}
          className={shared.input}
        >
          <option value="">Semua jenis</option>
          {Object.entries(kindLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <button className={`${shared.action} ${shared.yellow}`} type="submit">
          Lihat data
        </button>
        <Link className={shared.action} href="/catalog">
          Reset pencarian
        </Link>
      </Form>
      <div className={styles.tools}>
        <p>
          {result.places.length} dari {catalog.places.length} titik
        </p>
        <a href="/api/catalog" target="_blank" rel="noopener noreferrer">
          Lihat JSON sumber
        </a>
      </div>
      {result.places.length ? (
        <div className={styles.list}>
          {result.places.map((place) => (
            <article
              className={styles.place}
              key={place.id}
              aria-label={place.name}
            >
              <p className={shared.step}>
                {catalog.areas.find((a) => a.id === place.area)?.name} ·{" "}
                {kindLabels[place.kind]}
              </p>
              <h2>{place.name}</h2>
              <CatalogPhoto placeId={place.id} mapsUrl={googleMapsUrl(place)} />
              <a
                className={styles.mapsAction}
                href={googleMapsUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka Google Maps
              </a>
              <dl className={styles.fields}>
                <div>
                  <dt>Alamat OSM</dt>
                  <dd>{place.address ?? "Belum tersedia"}</dd>
                </div>
                <div>
                  <dt>Cuisine (tag)</dt>
                  <dd>{place.cuisine ?? "Belum tersedia"}</dd>
                </div>
                <div>
                  <dt>Jam buka (tag)</dt>
                  <dd>{place.openingHours ?? "Belum tersedia"}</dd>
                </div>
                <div>
                  <dt>Koordinat</dt>
                  <dd>
                    {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                  </dd>
                </div>
              </dl>
              <a
                href={place.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Lihat titik OSM · {place.id}
              </a>
              {place.website ? (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website yang tercantum di OSM
                </a>
              ) : (
                <p className={shared.caption}>Website belum tersedia di OSM.</p>
              )}
              {place.websiteInspection ? (
                <section
                  className={styles.inspection}
                  aria-label={`Ekstraksi website ${place.name}`}
                >
                  <h3>Hasil Scrapling</h3>
                  {place.websiteInspection.status === "fetched" ? (
                    <>
                      <p>
                        Judul halaman:{" "}
                        {place.websiteInspection.pageTitle ?? "Tidak ditemukan"}
                      </p>
                      {place.websiteInspection.menuUrl ? (
                        <a
                          href={place.websiteInspection.menuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Tautan menu dari halaman sumber
                        </a>
                      ) : null}
                      <p>
                        Item menu dan harga belum diekstrak. Ini ekstraksi
                        halaman website, bukan verifikasi pemilik.
                      </p>
                    </>
                  ) : (
                    <p>
                      {place.websiteInspection.status === "robots_disallowed"
                        ? "Pengambilan tidak diizinkan robots.txt."
                        : "Website tidak berhasil diambil; tidak ada data yang ditebak."}
                    </p>
                  )}
                  <a
                    href={place.websiteInspection.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sumber ekstraksi website
                  </a>
                  <p>
                    Diperiksa {date(place.websiteInspection.checkedAt)} WIB.
                  </p>
                </section>
              ) : null}
              <p className={shared.caption}>
                Data OSM diambil {date(place.fetchedAt)} WIB.
                {place.osmEditedAt
                  ? ` Titik OSM terakhir diedit ${date(place.osmEditedAt)} WIB; bukan tanggal verifikasi usaha.`
                  : ""}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.place}>
          <h2>Tidak ada hasil</h2>
          <p>Coba nama lain atau reset pencarian.</p>
          <Link className={`${shared.action} ${shared.yellow}`} href="/catalog">
            Tampilkan semua titik
          </Link>
        </section>
      )}
      <p className={shared.caption}>
        Tanpa rating, review Google, foto ilustratif, atau status halal buatan.
        Data OSM dapat tidak lengkap atau sudah berubah. Gunakan tautan sumber
        untuk memeriksa tiap tempat.
      </p>
    </JourneyLayout>
  );
}
