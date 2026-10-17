"""Assembla la pagina dell'Atlante orbitale per il sito Jekyll.
Uso:  python3 build.py            (dalla cartella _sorgenti)
Legge template.html, app.js, kessler.js, data.b64 e scrive ../index.html.
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = '/strumenti/atlante-orbitale/'
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()

FRONT = '''---
layout: null
title: "Atlante orbitale"
description: "Un atlante interattivo dello spazio attorno alla Terra: oltre 31.000 oggetti catalogati su un globo 3D, i tipi di orbita, le stazioni spaziali, i rocket body, le nubi di detriti e un simulatore della sindrome di Kessler."
permalink: /strumenti/atlante-orbitale/
---
'''
HEAD = '''{% seo %}
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/images/favicon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
{% raw %}'''

def replace(s, a, b):
    assert a in s, 'non trovato: ' + a[:70]
    return s.replace(a, b, 1)

t = rd('template.html')
i0 = t.index('<title>'); i1 = t.index('\n', t.index('<meta name="description"'))
t = t[:i0] + HEAD + t[i1 + 1:]
t = replace(t, '"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"',
            f'"three":"{BASE}vendor/three.module.js","three/addons/":"{BASE}vendor/"')
t = replace(t, '<div class="brand"><b>◉</b> Atlante orbitale</div>',
            '<div class="brand"><a class="crumb" href="/strumenti/">Strumenti</a><span class="sep">›</span><b>◉</b> Atlante orbitale</div>')
t = replace(t, '.brand b{color:var(--acc);font-weight:500}',
            '.brand b{color:var(--acc);font-weight:500}\n.brand .crumb{color:var(--ink3);text-decoration:none}.brand .crumb:hover{color:var(--ink)}\n.brand .sep{color:var(--ink3);margin:0 8px}\n@media (max-width:640px){.brand .crumb,.brand .sep{display:none}}')
t = replace(t, '<div class="tt" id="tt"></div>',
            '<div class="wrap" style="padding-bottom:40px"><p class="note"><strong style="color:var(--ink)">Hai un commento su questo strumento o un\'idea per uno nuovo?</strong> <a href="/contatti/">Scrivimi</a>. Trovi gli altri strumenti in <a href="/strumenti/">Strumenti</a>.</p></div>\n<div class="tt" id="tt"></div>')
app = rd('app.js')
app = replace(app, "fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')", f"fetch('{BASE}vendor/land-110m.json')")
t = t.replace('__DATA__', rd('data.b64')).replace('__KESSLER__', rd('kessler.js')).replace('__APP__', app)
t = replace(t, '</body>\n</html>', '</body>\n</html>\n{% endraw %}')
assert '{% endraw' not in t[:t.rindex('{% endraw')]
out = os.path.join(HERE, '..', 'index.html')
open(out, 'w', encoding='utf-8').write(FRONT + t)
print('scritto', os.path.normpath(out), len(FRONT + t), 'byte')
