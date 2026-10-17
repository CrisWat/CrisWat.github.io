# Atlante orbitale — sorgenti

Pagina pubblicata in `/strumenti/atlante-orbitale/`. Questa cartella inizia con `_`, quindi Jekyll **non** la pubblica.

## Struttura

```
strumenti/atlante-orbitale/
├── index.html            ← pagina generata (non modificarla a mano)
├── vendor/               ← librerie servite dal sito, nessuna CDN
│   ├── three.module.js           three.js 0.160.0 (licenza MIT)
│   ├── controls/OrbitControls.js three.js 0.160.0 (licenza MIT)
│   └── land-110m.json            linee di costa, world-atlas 2.0.2 / Natural Earth (ISC, dominio pubblico)
└── _sorgenti/
    ├── template.html     HTML e CSS della pagina, con i segnaposto __DATA__, __KESSLER__, __APP__
    ├── app.js            globo 3D, grafici, schede
    ├── kessler.js        modello Kessler a gusci
    ├── extract.py        estrae lo snapshot dal database SatTrack → data.b64
    ├── data.b64          snapshot compresso (gzip + base64), oggi: GP Space-Track del 12/8/2026
    └── build.py          assembla ../index.html
```

## Aggiornare i dati

1. Scarica un nuovo file GP da Space-Track nel database
   (`01_satcat_celestrack/raw/spacetrack_gp/spacetrack_gp_AAAAMMGGThhmmssZ.csv`)
   e, se possibile, aggiorna SATCAT, GCAT e la classificazione delle missioni.
2. `python3 extract.py ~/INTELLIGENCE/consueling/database/01_satcat_celestrack`
   (prende in automatico i file più recenti; la data dello snapshot viene dal nome del file GP).
3. `python3 build.py`
4. Controlla in locale con `bundle exec jekyll serve` e apri `/strumenti/atlante-orbitale/`.

Nota: aprire `index.html` con doppio clic non funziona, sia per il front matter Jekyll sia perché i browser bloccano i moduli JavaScript da `file://`.

Se modifichi testi nella sezione stazioni o nubi, sono in `app.js` (`stations()`, `CLOUDS`) e in `template.html`.

## Elenco degli strumenti

La pagina `/strumenti/` legge `_data/strumenti.yml`. Voce da aggiungere (adatta i campi a quelli che usi già):

```yaml
- title: "Atlante orbitale"
  url: /strumenti/atlante-orbitale/
  category: "Spazio"
  tagline: "Tutto quello che orbita attorno alla Terra, su un globo 3D"
  description: "Oltre 31.000 oggetti catalogati: satelliti, stazioni spaziali, rocket body e detriti. Confronta le orbite, esplora le nubi di frammenti e simula la sindrome di Kessler."
```

## Fonti e licenze dei dati

- Elementi orbitali: 18th/19th Space Defense Squadron via Space-Track.org. La ridistribuzione dei dati SSA di base è consentita citando la fonte (User Agreement); la citazione è nella pagina.
- SATCAT: CelesTrak. Masse: GCAT (J. McDowell, CC-BY). Classificazione missioni: tassonomia SatTrack.
