#!/usr/bin/env python3
"""
Scarica i dati per lo strumento "Il tuo comune nel 2050".
Usa solo la libreria standard di Python. Va lanciato dalla cartella SITO:

    python3 strumenti/comune-2050/_sorgenti/scarica_dati.py

Scarica in SITO/_dati-clima/ (cartella ignorata da Jekyll e da git):
  - World Bank Climate Change Knowledge Portal (CCKP), bucket pubblico S3 "wbg-cckp":
      CMIP6 a 0,25 gradi (corretti con metodo BCSD su ERA5, secondo i metadati CCKP), insieme di tutti i modelli, valori annuali:
      hd30, hd35, tr, tas  -> climatologia 1995-2014 e 2040-2059 (mediana, p10, p90)
      e le anomalie 2040-2059 (mediana, p10, p90), scenari SSP1-2.6, SSP2-4.5, SSP5-8.5
      ERA5 a 0,25 gradi: serie annuale osservata della temperatura media (tas)
  - ISTAT: confini dei comuni al 1 gennaio 2026 (versione generalizzata) e altimetria dei comuni
  - Natural Earth: terre emerse alla scala 1:10 milioni
Salva anche l'elenco completo dei file trovati (manifest.json), per controllo.
"""
import json, os, re, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

BUCKET = "https://wbg-cckp.s3.us-west-2.amazonaws.com/"
NS = "{http://s3.amazonaws.com/doc/2006-03-01/}"
OUT = os.path.join(os.getcwd(), "_dati-clima")
ISTAT = "https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip"
ALTIMETRIA = "https://www.istat.it/wp-content/uploads/2026/02/Altimetria_Comuni-al-31_12_2021.xlsx"
TERRE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson"

VARS = ["hd30", "hd35", "tr", "tas"]
SCEN = ["historical", "ssp126", "ssp245", "ssp585"]
PCT = "(median|p10|p90)"


def get(url, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return r.read()
        except Exception as e:
            if k == tries - 1:
                raise
            print("   riprovo:", e); time.sleep(3 * (k + 1))


def ls(prefix, delimiter=None):
    """Elenca chiavi e sottocartelle sotto un prefisso (ListObjectsV2, con paginazione)."""
    keys, dirs, token = [], [], None
    while True:
        q = {"list-type": "2", "prefix": prefix}
        if delimiter: q["delimiter"] = delimiter
        if token: q["continuation-token"] = token
        root = ET.fromstring(get(BUCKET + "?" + urllib.parse.urlencode(q)))
        for c in root.findall(NS + "Contents"):
            keys.append((c.find(NS + "Key").text, int(c.find(NS + "Size").text)))
        for p in root.findall(NS + "CommonPrefixes"):
            dirs.append(p.find(NS + "Prefix").text)
        if root.find(NS + "IsTruncated").text == "true":
            token = root.find(NS + "NextContinuationToken").text
        else:
            return keys, dirs


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        print("   già presente:", os.path.basename(dest)); return
    tmp = dest + ".part"
    with urllib.request.urlopen(url, timeout=300) as r, open(tmp, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)
    os.replace(tmp, dest)
    print("   scaricato:", os.path.basename(dest), round(os.path.getsize(dest) / 1e6, 1), "MB")


def find_collection_root(name):
    """Trova il prefisso sotto cui sta una collezione (es. 'data/cmip6-x0.25/')."""
    todo, seen = [""], 0
    while todo and seen < 60:
        p = todo.pop(0); seen += 1
        _, dirs = ls(p, "/")
        for d in dirs:
            if d.rstrip("/").split("/")[-1] == name:
                return d
        if p.count("/") < 2:
            todo.extend(dirs)
    raise SystemExit("Collezione non trovata: " + name)


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    wanted = []

    croot = find_collection_root("cmip6-x0.25")
    print("CMIP6 in:", croot)
    for v in VARS:
        for s in SCEN:
            prefix = f"{croot}{v}/ensemble-all-{s}/"
            keys, _ = ls(prefix)
            manifest[prefix] = keys
            print(f"{prefix}: {len(keys)} file")
            for k, size in keys:
                fn = k.split("/")[-1]
                periods = "1995-2014" if s == "historical" else "2040-2059"
                if re.fullmatch(rf"(climatology|anomaly)-{v}-annual-mean_cmip6-x0\.25_ensemble-all-{s}_climatology_{PCT}_{periods}\.nc", fn):
                    wanted.append((k, size))

    eroot = find_collection_root("era5-x0.25")
    print("ERA5 in:", eroot)
    _, edirs = ls(f"{eroot}tas/", "/")
    for d in edirs:
        keys, _ = ls(d)
        manifest[d] = keys
        print(f"{d}: {len(keys)} file")
        for k, size in keys:
            fn = k.split("/")[-1]
            if re.fullmatch(r"timeseries-tas-annual-mean_era5-x0\.25_.*_timeseries_mean_\d{4}-\d{4}\.nc", fn) or \
               re.fullmatch(r"climatology-tas-annual-mean_era5-x0\.25_.*_climatology_mean_(1991-2020|1995-2014)\.nc", fn):
                wanted.append((k, size))

    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)

    tot = sum(s for _, s in wanted)
    print(f"\nDa scaricare: {len(wanted)} file, {tot/1e6:.0f} MB in tutto")
    for k, size in wanted:
        download(BUCKET + urllib.parse.quote(k), os.path.join(OUT, k.split("/")[-1]))

    print("\nISTAT, confini dei comuni:")
    download(ISTAT, os.path.join(OUT, os.path.basename(ISTAT)))
    print("\nISTAT, altimetria dei comuni:")
    download(ALTIMETRIA, os.path.join(OUT, "Altimetria_Comuni.xlsx"))
    print("\nNatural Earth, terre emerse 1:10 milioni (per la quota di terra di ogni cella):")
    download(TERRE, os.path.join(OUT, "ne_10m_land.geojson"))
    print("\nFatto. File in", OUT)


if __name__ == "__main__":
    main()
