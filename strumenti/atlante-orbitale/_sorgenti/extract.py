"""Estrae lo snapshot compatto per l'Atlante orbitale dal database SatTrack.
Uso:  python3 extract.py /percorso/database/01_satcat_celestrack
Prende i file piu' recenti (GP Space-Track, SATCAT CelesTrak, GCAT, classificazione missioni)
e scrive data.b64 accanto a questo script."""
import csv, json, re, gzip, base64, collections, datetime as dt, math, sys, glob, os
U = sys.argv[1] if len(sys.argv) > 1 else '.'
HERE = os.path.dirname(os.path.abspath(__file__))
def latest(pat):
    f = sorted(glob.glob(os.path.join(U, pat)))
    if not f: sys.exit('File non trovato: ' + pat)
    return f[-1]
GP_FILE = latest('raw/spacetrack_gp/spacetrack_gp_*.csv')
SC_FILE = latest('raw/celestrak_satcat_*.csv')
print('GP:', GP_FILE); print('SATCAT:', SC_FILE)
csv.field_size_limit(10**8)
gp = list(csv.DictReader(open(GP_FILE)))
mis = {r['NORAD_CAT_ID']: r for r in csv.DictReader(open(os.path.join(U, 'processed/earth_orbit_payloads_mission_latest.csv')))}
mass = {}
with open(os.path.join(U, 'raw/gcat/satcat.tsv')) as f:
    r = csv.reader(f, delimiter='\t'); h = next(r)
    iS, iM, iD = h.index('Satcat'), h.index('Mass'), h.index('DryMass')
    for x in r:
        if x[0].startswith('#') or len(x) <= iD: continue
        try:
            n = str(int(x[iS]))
        except: continue
        def num(s):
            try: return float(s)
            except: return 0
        m = num(x[iM]); d = num(x[iD])
        mass[n] = (m, d)

_d = re.search(r'(\d{8})T', os.path.basename(GP_FILE)).group(1)
REF = dt.datetime(int(_d[:4]), int(_d[4:6]), int(_d[6:8]))
TYPES = {'PAYLOAD': 0, 'ROCKET BODY': 1, 'DEBRIS': 2, 'UNKNOWN': 3}
RCS = {'': 0, 'SMALL': 1, 'MEDIUM': 2, 'LARGE': 3}
DOM = ['', 'TELECOMMUNICATIONS', 'EARTH_OBSERVATION', 'PNT', 'METEOROLOGY', 'SCIENCE', 'TECHNOLOGY',
       'SIGNALS_INTELLIGENCE', 'EARLY_WARNING', 'OTHER', 'HUMAN_SPACEFLIGHT']
GROUPS = ['', 'station', 'starlink', 'oneweb', 'kuiper', 'qianfan', 'guowang', 'gnss', 'iridium',
          'c_fengyun', 'c_cosmos2251', 'c_iridium33', 'c_cz6a', 'c_noaa16', 'c_dmsp13']
CLOUDS = {'FENGYUN 1C': 'c_fengyun', 'COSMOS 2251': 'c_cosmos2251', 'IRIDIUM 33': 'c_iridium33',
          'CZ-6A': 'c_cz6a', 'NOAA 16': 'c_noaa16', 'DMSP 5D-2 F13': 'c_dmsp13'}
STATION = re.compile(r'^(ISS \(|CSS \(|DRAGON|PROGRESS MS|CYGNUS|SOYUZ MS|TIANZHOU|SHENZHOU|HTV)')
countries = collections.Counter(g['COUNTRY_CODE'] for g in gp)
CC = [c for c, _ in countries.most_common()]

cols = {k: [] for k in ['nm', 'id', 'cos', 't', 'c', 'ld', 'rcs', 'ep', 'n', 'e', 'i', 'O', 'w', 'M', 'ms', 'md', 'st', 'g', 'nd']}
for g in gp:
    nm = g['OBJECT_NAME']; t = TYPES[g['OBJECT_TYPE']]
    ep = dt.datetime.fromisoformat(g['EPOCH'])
    grp = ''
    if t == 0 or (STATION.match(nm)):
        if STATION.match(nm) and float(g['PERIAPSIS']) < 450: grp = 'station'
        elif nm.startswith('STARLINK'): grp = 'starlink'
        elif nm.startswith('ONEWEB'): grp = 'oneweb'
        elif nm.startswith('KUIPER'): grp = 'kuiper'
        elif nm.startswith('QIANFAN'): grp = 'qianfan'
        elif nm.startswith('HULIANWANG'): grp = 'guowang'
        elif nm.startswith('IRIDIUM'): grp = 'iridium'
    if t == 2:
        for k, v in CLOUDS.items():
            if nm.startswith(k + ' DEB'): grp = v
    m = mis.get(g['NORAD_CAT_ID'])
    md = ''; st = -1
    if t == 0 and m:
        md = m['MISSION_DOMAIN'] if m['MISSION_DOMAIN'] in DOM else 'OTHER'
        st = 1 if m['IS_ACTIVE'] == 'True' else 0
        if md == 'PNT' and grp == '': grp = 'gnss'
    if grp == 'station': md = 'HUMAN_SPACEFLIGHT'
    ms = mass.get(g['NORAD_CAT_ID'], (0, 0))
    mk = ms[1] or ms[0]
    cols['nm'].append(nm); cols['id'].append(int(g['NORAD_CAT_ID'])); cols['cos'].append(g['OBJECT_ID'])
    cols['t'].append(t); cols['c'].append(CC.index(g['COUNTRY_CODE'])); cols['ld'].append(g['LAUNCH_DATE'])
    cols['rcs'].append(RCS.get(g['RCS_SIZE'], 0))
    cols['ep'].append(round((ep - REF).total_seconds()))
    cols['n'].append(float(g['MEAN_MOTION'])); cols['e'].append(float(g['ECCENTRICITY']))
    cols['i'].append(float(g['INCLINATION'])); cols['O'].append(float(g['RA_OF_ASC_NODE']))
    cols['w'].append(float(g['ARG_OF_PERICENTER'])); cols['M'].append(float(g['MEAN_ANOMALY']))
    cols['ms'].append(int(round(mk))); cols['md'].append(DOM.index(md)); cols['st'].append(st)
    cols['g'].append(GROUPS.index(grp))
    cols['nd'].append(float(g['MEAN_MOTION_DOT']))

# compact numbers
def r(x, d):
    return [round(v, d) for v in x]
cols['n'] = r(cols['n'], 8); cols['e'] = r(cols['e'], 7)
for k in 'iOwM': cols[k] = r(cols[k], 4)
cols['nd'] = [float('%.3g' % v) for v in cols['nd']]

# SATCAT totals (incl. objects without public GP)
sc = list(csv.DictReader(open(SC_FILE)))
onorb = collections.Counter(x['OBJECT_TYPE'] for x in sc if x['DECAY_DATE'] == '' and x['ORBIT_CENTER'] == 'EA')
decayed = collections.Counter(x['OBJECT_TYPE'] for x in sc if x['DECAY_DATE'] != '')
# launches per year of currently-on-orbit vs all
meta = {
    'ref': REF.isoformat() + 'Z', 'cc': CC, 'dom': DOM, 'groups': GROUPS,
    'gp_created': gp[0]['CREATION_DATE'],
    'satcat_onorbit': dict(onorb), 'satcat_decayed': dict(decayed), 'satcat_total': len(sc),
}
out = {'meta': meta, 'cols': cols}
js = json.dumps(out, separators=(',', ':'))
print('json bytes', len(js))
gz = gzip.compress(js.encode(), 9)
print('gz bytes', len(gz))
b64 = base64.b64encode(gz).decode()
open(os.path.join(HERE, 'data.b64'), 'w').write(b64)
print('b64', len(b64))
print(meta['satcat_onorbit'], meta['satcat_decayed'])
print(collections.Counter(cols['g']))
