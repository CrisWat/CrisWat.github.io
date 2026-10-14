---
layout: page
title: "Blog"
permalink: /blog/
eyebrow: "Blog"
description: "Articoli di Cristiano Fanelli su intelligenza artificiale, tecnologie emergenti, clima, ricerca e sicurezza."
intro: "Riflessioni su intelligenza artificiale, tecnologia, clima, ricerca e sicurezza, scritte per essere lette da tutti."
---

{% if site.posts.size > 0 %}
<ul class="post-list">
{% for post in site.posts %}
    <li>
        <p class="post-meta">{{ post.date | date: "%d/%m/%Y" }}{% if post.category %} · {{ post.category }}{% endif %}</p>
        <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        {% if post.description %}<p>{{ post.description }}</p>{% else %}{{ post.excerpt }}{% endif %}
    </li>
{% endfor %}
</ul>
{% else %}
<p>Nessun articolo pubblicato per il momento.</p>
{% endif %}

<section class="offer-box">
    <h2>Di cosa vorresti che scrivessi?</h2>
    <ul>
        <li><strong>Hai un tema da propormi?</strong> Una domanda, una notizia o un problema che vorresti vedere spiegato con i dati.</li>
        <li><strong>Non sei d'accordo con un articolo?</strong> Le critiche e le esperienze dirette sono benvenute: le proposte crescono con il confronto.</li>
        <li><strong>Sei una redazione, un'associazione o una scuola?</strong> Possiamo collaborare su articoli, analisi e incontri.</li>
    </ul>
    <div class="page-links">
        <a class="button button-primary" href="{{ '/contatti/' | relative_url }}">Scrivimi <span class="arrow" aria-hidden="true">→</span></a>
    </div>
</section>
