#!/usr/bin/env python3
"""
Elabora i dati scaricati da scarica_dati.py e produce strumenti/comune-2050/dati.json.
Lanciare dalla cartella SITO:  python3 strumenti/comune-2050/_sorgenti/elabora.py
Richiede: numpy, netCDF4, pyshp, shapely, pyproj, openpyxl.

Metodo
- Per ogni comune ISTAT (confini al 1/1/2026) si prende un punto interno al territorio
  (il baricentro, oppure un punto interno se il baricentro cade fuori) e lo si porta in lon/lat.
- Si sceglie la cella della griglia a 0,25 gradi il cui centro è più vicino a quel punto.
  Se meno di metà della cella è terra emersa (Natural Earth 1:10 milioni), si prende la cella
  più vicina con almeno metà di terra, entro 2 celle; se non c'è, si resta sulla cella di mare
  e lo si segna (piccole isole).
- Quota media della cella: media delle quote medie dei comuni italiani (ISTAT, da NASADEM),
  pesata con la superficie di ciascun comune che cade nella cella (solo territorio italiano).
- Per ogni cella si salvano, senza altre elaborazioni:
  * CMIP6 (insieme di tutti i modelli, CCKP): per hd30, hd35, tr, tas
      clim. 1995-2014 [mediana, p10, p90]
      per ssp126/ssp245/ssp585: clim. 2040-2059 [mediana, p10, p90] e anomalia 2040-2059 [mediana, p10, p90]
      e il giudizio di robustezza del cambiamento (anomalysignificance) della mediana
  * ERA5: temperatura media annuale 1950-2025 della cella; da qui le medie 1961-1990 e 1995-2014.
"""
import json, os, glob, zipfile, tempfile
import numpy as np, netCDF4 as nc, shapefile, openpyxl
from shapely.geometry import shape, box
from shapely.ops import transform as shp_transform, unary_union
from shapely.strtree import STRtree
from shapely import prepared
from pyproj import Transformer

SITO = os.getcwd()
RAW = os.path.join(SITO, "_dati-clima")
OUT = os.path.join(SITO, "strumenti", "comune-2050", "dati.json")
VARS = ["hd30", "hd35", "tr", "tas"]
SSPS = ["ssp126", "ssp245", "ssp585"]
PCTS = ["median", "p10", "p90"]
ERA5_TS = "timeseries-tas-annual-mean_era5-x0.25_era5-x0.25-historical_timeseries_mean_1950-2025.nc"


def grid(fname, var):
    d = nc.Dataset(os.path.join(RAW, fname))
    a = np.ma.filled(d.variables[var][0].astype("f8"), np.nan)
    lat, lon = d.variables["lat"][:].astype("f8"), d.variables["lon"][:].astype("f8")
    sig = None
    if "anomalysignificance-" + var.split("-", 1)[1] in d.variables:
        sig = np.ma.filled(d.variables["anomalysignificance-" + var.split("-", 1)[1]][0].astype("f8"), np.nan)
    d.close()
    return a, lat, lon, sig


def main():
    # ---------- comuni ----------
    tmp = tempfile.mkdtemp()
    zipfile.ZipFile(os.path.join(RAW, "Limiti01012026_g.zip")).extractall(tmp)
    def rd(pat):
        return shapefile.Reader(glob.glob(os.path.join(tmp, "**", pat), recursive=True)[0], encoding="utf-8")
    prov = {r["COD_UTS"]: r["SIGLA"] for r in rd("ProvCM*.shp").records()}
    reg = {r["COD_REG"]: r["DEN_REG"] for r in rd("Reg01*.shp").records()}
    tr = Transformer.from_crs("EPSG:32632", "EPSG:4326", always_xy=True)
    # altimetria ISTAT (comuni al 31/12/2021)
    ws = openpyxl.load_workbook(os.path.join(RAW, "Altimetria_Comuni.xlsx"), read_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    hdr = list(rows[1])
    ALT = {int(r[hdr.index("PRO_COM")]): (float(r[hdr.index("MEDIA")]), float(r[hdr.index("ALT CENTR MUN")])) for r in rows[2:] if r[hdr.index("PRO_COM")]}
    # dal 2021 alcuni comuni hanno cambiato codice (es. nuove province della Sardegna):
    # se il codice non c'è, si cerca lo stesso nome nella stessa regione
    norm = lambda x: " ".join(str(x).lower().replace("’", "'").split())
    ALT_NOME = {}
    for r in rows[2:]:
        if r[hdr.index("PRO_COM")]:
            ALT_NOME.setdefault((norm(r[hdr.index("COMUNE")]), int(r[hdr.index("COD_REG")])), []).append((float(r[hdr.index("MEDIA")]), float(r[hdr.index("ALT CENTR MUN")])))
    com, geoms = [], []
    rc = rd("Com01*.shp")
    for sr in rc.iterShapeRecords():
        g = shape(sr.shape.__geo_interface__)
        p = g.centroid if g.contains(g.centroid) else g.representative_point()
        lon, lat = tr.transform(p.x, p.y)
        r = sr.record
        a = ALT.get(int(r["PRO_COM"]))
        if a is None:
            cand = ALT_NOME.get((norm(r["COMUNE"]), int(r["COD_REG"])), [])
            a = cand[0] if len(cand) == 1 else None
        com.append(dict(name=r["COMUNE"], alt=r["COMUNE_A"] or "", istat=r["PRO_COM_T"],
                        sig=prov[r["COD_UTS"]], reg=r["COD_REG"], lon=lon, lat=lat,
                        quota_media=a[0] if a else None, quota_centro=a[1] if a else None))
        geoms.append(shp_transform(tr.transform, g))
    print("comuni:", len(com), " senza altimetria (comuni nati dopo il 2021):", sum(c["quota_centro"] is None for c in com))
    tree = STRtree(geoms)

    # terre emerse (Natural Earth 1:10 milioni)
    area = box(5, 34, 20, 48.5)
    land = unary_union([shape(f["geometry"]).intersection(area) for f in json.load(open(os.path.join(RAW, "ne_10m_land.geojson")))["features"] if shape(f["geometry"]).intersects(area)])
    pland = prepared.prep(land)
    def land_frac(lo, la):
        b = box(lo - 0.125, la - 0.125, lo + 0.125, la + 0.125)
        if pland.contains(b): return 1.0
        if not pland.intersects(b): return 0.0
        return land.intersection(b).area / b.area
    def cell_alt(lo, la):
        b = box(lo - 0.125, la - 0.125, lo + 0.125, la + 0.125)
        num = den = 0.0
        for k in tree.query(b):
            qm = com[k]["quota_media"]
            if qm is None: continue
            w = geoms[k].intersection(b).area
            num += w * qm; den += w
        return (num / den if den else None), den / b.area

    # ---------- griglie ----------
    G = {}
    for v in VARS:
        G[(v, "hist")] = grid(f"climatology-{v}-annual-mean_cmip6-x0.25_ensemble-all-historical_climatology_median_1995-2014.nc", f"climatology-{v}-annual-mean")
        for p in PCTS:
            G[(v, "hist", p)] = grid(f"climatology-{v}-annual-mean_cmip6-x0.25_ensemble-all-historical_climatology_{p}_1995-2014.nc", f"climatology-{v}-annual-mean")[0]
            for s in SSPS:
                G[(v, s, "c", p)] = grid(f"climatology-{v}-annual-mean_cmip6-x0.25_ensemble-all-{s}_climatology_{p}_2040-2059.nc", f"climatology-{v}-annual-mean")[0]
                a, _, _, sig = grid(f"anomaly-{v}-annual-mean_cmip6-x0.25_ensemble-all-{s}_climatology_{p}_2040-2059.nc", f"anomaly-{v}-annual-mean")
                G[(v, s, "a", p)] = a
                if p == "median":
                    G[(v, s, "sig")] = sig
    _, lat, lon, _ = G[("tas", "hist")]
    lon180 = np.where(lon > 180, lon - 360, lon)

    e = nc.Dataset(os.path.join(RAW, ERA5_TS))
    elat, elon = e.variables["lat"][:].astype("f8"), e.variables["lon"][:].astype("f8")
    elon180 = np.where(elon > 180, elon - 360, elon)
    years = [int(nc.num2date(t, e.variables["time"].units, e.variables["time"].calendar).year) for t in e.variables["time"][:]]
    assert years == list(range(1950, 2026)), years
    ets = e.variables["timeseries-tas-annual-mean"]

    # maschera: celle con tutti i valori CMIP6 validi
    valid = np.ones_like(G[("tas", "hist")][0], dtype=bool)
    for k, a in G.items():
        if isinstance(a, tuple): a = a[0]
        if k[-1] == "sig" or a is None: continue
        valid &= np.isfinite(a)

    LF = {}
    def lf(i, j):
        if (i, j) not in LF: LF[(i, j)] = land_frac(float(lon180[j]), float(lat[i]))
        return LF[(i, j)]
    def choose(lo, la):
        """Cella più vicina con dati e almeno metà di terra; altrimenti la più vicina (mare)."""
        i, j = int(np.abs(lat - la).argmin()), int(np.abs(lon180 - lo).argmin())
        assert valid[i, j]
        if lf(i, j) >= 0.5: return i, j, 0
        best = None
        for di in range(-2, 3):
            for dj in range(-2, 3):
                ii, jj = i + di, j + dj
                if valid[ii, jj] and lf(ii, jj) >= 0.5:
                    dd = (lat[ii] - la) ** 2 + ((lon180[jj] - lo) * np.cos(np.radians(la))) ** 2
                    if best is None or dd < best[0]: best = (dd, ii, jj)
        if best: return best[1], best[2], 1
        return i, j, 2

    cells, cidx = [], {}
    moved = [0, 0, 0]
    for c in com:
        i, j, mv = choose(c["lon"], c["lat"])
        moved[mv] += 1
        if (i, j) not in cidx:
            cidx[(i, j)] = len(cells)
            # ERA5 della stessa cella (stesse coordinate dei centri)
            ei, ej = int(np.abs(elat - lat[i]).argmin()), int(np.abs(elon180 - lon180[j]).argmin())
            assert abs(elat[ei] - lat[i]) < 1e-6 and abs(elon180[ej] - lon180[j]) < 1e-6
            series = np.ma.filled(ets[:, ei, ej].astype("f8"), np.nan)
            assert np.all(np.isfinite(series)), (lat[i], lon180[j])
            qa, qf = cell_alt(float(lon180[j]), float(lat[i]))
            # ERA5: medie calcolate sui valori originali, arrotondate una sola volta (0,1 °C)
            yi = lambda y: years.index(y)
            b6190 = float(series[yi(1961):yi(1990) + 1].mean())
            b9514 = float(series[yi(1995):yi(2014) + 1].mean())
            last10 = float(series[yi(2016):yi(2025) + 1].mean())
            hot = int(np.argmax(series))
            cell = dict(lat=round(float(lat[i]), 3), lon=round(float(lon180[j]), 3),
                        terra=round(lf(i, j), 2), quota=None if qa is None else round(qa), quota_copertura=round(qf, 2),
                        era5=[round(float(x), 1) for x in series],
                        # [media 1961-1990, media 1995-2014, media 2016-2025, anno più caldo, sua temperatura]
                        oss=[round(b6190, 1), round(b9514, 1), round(last10, 1), years[hot], round(float(series[hot]), 1)],
                        # riquadri 2050 delle strisce: (ERA5 1995-2014 - ERA5 1961-1990) + anomalia mediana tas, per scenario
                        s2050=[round(b9514 - b6190 + float(G[("tas", s_, "a", "median")][i, j]), 1) for s_ in SSPS])
            # per ogni indicatore: [oggi (mediana 1995-2014),
            #   anomalia 2040-2059 ssp126 (mediana, p10, p90), ssp245 (...), ssp585 (...)]
            # valori arrotondati una sola volta, come appaiono nella pagina:
            # giorni all'unità, temperatura al decimo di grado.
            # Per la temperatura media, «1995-2014» è la media osservata ERA5 (coerente con le strisce).
            for v in VARS:
                rnd = (lambda x: round(x, 1)) if v == "tas" else (lambda x: int(round(x)))
                base = b9514 if v == "tas" else float(G[(v, "hist", "median")][i, j])
                cell[v] = [rnd(base)] + [rnd(float(G[(v, s, "a", p)][i, j])) for s in SSPS for p in PCTS]
            cells.append(cell)
        c["cell"] = cidx[(i, j)]
        c["moved"] = mv
    print("celle:", len(cells), " comuni: cella più vicina", moved[0], "| spostati su cella di terra", moved[1], "| restati su cella di mare", moved[2])

    out = dict(
        meta=dict(
            comuni="ISTAT, confini delle unità amministrative al 1 gennaio 2026 (versione generalizzata)",
            proiezioni="World Bank Climate Change Knowledge Portal, CMIP6 a 0,25 gradi, insieme di tutti i modelli (ensemble-all)",
            osservazioni="ERA5 (Copernicus/ECMWF) a 0,25 gradi tramite World Bank CCKP, serie annuale 1950-2025",
            indicatori="per ogni indicatore: [valore 1995-2014 (giorni: mediana dei modelli; tas: media ERA5), poi per ssp126, ssp245, ssp585: anomalia 2040-2059 rispetto al 1995-2014 come mediana, 10° e 90° percentile dei modelli]; giorni arrotondati all'unità, tas a 0,1 °C",
            oss="[media ERA5 1961-1990, 1995-2014, 2016-2025, anno più caldo, sua media] in °C",
            s2050="anomalia 2040-2059 rispetto al 1961-1990 per ssp126, ssp245, ssp585: (ERA5 1995-2014 - ERA5 1961-1990) + anomalia mediana CMIP6 di tas",
            scenari=SSPS, periodo_oggi="1995-2014", periodo_2050="2040-2059"),
        years=years,
        regioni={str(k): v for k, v in sorted(reg.items())},
        cells=cells,
        # [nome, nome straniero, sigla provincia, codice regione, indice cella, codice ISTAT, quota del centro (m), 0/1/2 = cella vicina / spostata su terra / di mare]
        comuni=[[c["name"], c["alt"], c["sig"], c["reg"], c["cell"], c["istat"],
                 None if c["quota_centro"] is None else round(c["quota_centro"]), c["moved"]] for c in sorted(com, key=lambda c: c["name"].lower())],
    )
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("scritto", OUT, round(os.path.getsize(OUT) / 1e3), "kB")
    # file di controllo con le coordinate di ogni comune (non pubblicato: in _sorgenti)
    with open(os.path.join(SITO, "strumenti", "comune-2050", "_sorgenti", "comuni_celle.csv"), "w", encoding="utf-8") as f:
        f.write("istat,comune,sigla,lon,lat,cella_lon,cella_lat,cella_terra,cella_quota,quota_centro,scelta_cella\n")
        for c in com:
            cl = cells[c["cell"]]
            f.write(f'{c["istat"]},"{c["name"]}",{c["sig"]},{c["lon"]:.5f},{c["lat"]:.5f},{cl["lon"]},{cl["lat"]},{cl["terra"]},{cl["quota"]},{c["quota_centro"]},{c["moved"]}\n')


if __name__ == "__main__":
    main()
