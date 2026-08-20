---
layout: page
title: "Blog"
permalink: /blog/
eyebrow: "Analisi e approfondimenti"
description: "Scienza, tecnologia, intelligence e geopolitica."
---

{% if site.posts.size > 0 %}

{% for post in site.posts %}

## [{{ post.title }}]({{ post.url | relative_url }})

{{ post.date | date: "%d/%m/%Y" }}

{{ post.excerpt }}

{% endfor %}

{% else %}

Nessun articolo pubblicato per il momento.

{% endif %}
