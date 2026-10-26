# Il tuo comune nel 2050 — sorgenti

Pagina pubblicata in `/strumenti/comune-2050/`. Questa cartella inizia con `_`, quindi Jekyll **non** la pubblica.

## File

```
strumenti/comune-2050/
├── index.html          ← la pagina (HTML, CSS e JS)
├── dati.json           ← dati per celle e comuni, generato da elabora.py (non modificarlo a mano)
└── _sorgenti/
    ├── scarica_dati.py ← scarica i dati grezzi in SITO/_dati-clima/ (cartella ignorata da git e da Jekyll)
    ├── elabora.py      ← produce dati.json
    └── comuni_celle.csv← controllo: punto di ogni comune, cella scelta, quote
```

## Rifare i calcoli

Dalla cartella SITO:

1. `python3 strumenti/comune-2050/_sorgenti/scarica_dati.py` (circa 950 MB, quasi tutti per la serie ERA5)
2. `pip install numpy netCDF4 pyshp shapely pyproj openpyxl`
3. `python3 strumenti/comune-2050/_sorgenti/elabora.py`

## Fonti

- World Bank Climate Change Knowledge Portal (CCKP), bucket S3 pubblico `wbg-cckp`: CMIP6 0,25°, `ensemble-all`, indicatori annuali hd30, hd35, tr, tas (climatologia 1995-2014, anomalie 2040-2059, mediana/p10/p90, scenari ssp126/ssp245/ssp585); ERA5 0,25°, serie annuale tas 1950-2025. Licenza CC BY 4.0.
- ISTAT: confini dei comuni al 1/1/2026 (generalizzati) e altimetria dei comuni al 31/12/2021.
- Natural Earth: terre emerse 1:10 milioni (pubblico dominio).

## Aggiornare

Quando il CCKP pubblica un nuovo anno ERA5, cambia `ERA5_TS` in `elabora.py` e gli intervalli di anni usati per «ultimi dieci anni» (anche nel testo della pagina).
