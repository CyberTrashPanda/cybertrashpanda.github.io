---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: default
---
<body>

<h1> Latest Posts </h1>
{% for post in site.posts limit:5 %}
    <a href="{{post.url}}">[{{post.date | date: '%d-%m-%Y'}}] {{post.title}}</a><br>
{% endfor %}
</body>
