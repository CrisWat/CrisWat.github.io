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
