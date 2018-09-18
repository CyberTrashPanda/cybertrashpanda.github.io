---
layout: default
title: Wordpress - From Editor to Admin by exploiting a Reflected XSS
date: 2017-11-21T16:51:59Z
categories: web-expl
---

### Intro
Let me start by saying "I've been planning to write this blog post for at least three months now." , who knows maybe even more but I finally found some spare time to wrap this thing up. 
Wordpress is of course a popular target for attackers and due to the popularity of the CMS, it can be found almost everywhere from  education institutes to private companies.
Of course exploiting reflected XSS attacks can be annoying thanks to the Google Chrome Sandbox.
But this is not the point of this post.

### Nonces
So if you are not familiar with what a Nonce is check out [this](https://codex.wordpress.org/WordPress_Nonces) for all the details.
TL;DR: It's a randomly generated string meant to only be used once and in the case of wordpress it is mainly used to protect against CSRF.

### The Vulnerability
I chose to exploit a reflective XSS vulnerability in the ["WP Statistics"](https://wordpress.org/plugins/wp-statistics/) plugin. You can find more info about the vulnerability in the [pluginvulnerabilities.com](https://www.pluginvulnerabilities.com/2017/04/28/reflected-cross-site-scripting-xss-vulnerability-in-wp-statistics/) website.

Sample PoC of the reflective XSS
{% highlight text %}
http://localhost/wp-admin/admin.php?page=wps_pages_page&page-uri=%22%3E%3Cscript%3Ealert(String.fromCharCode(77,117,115,104,117));%3C/script%3E
{% endhighlight %}

### The Exploit
So my goal was to gain admin priviledges from a "limited" account.
So here are the steps I had in mind for the attack.
- Send the XSS payload that includes my javascript file.
- Check user permissions.

if our victim is an admin.
- Add a new user

if our victim is an editor.
- Loop trough all posts.
- Edit each post appending our javascript code.
- Get a new user as soon as the admin visits his site.


### The Code

stage 1
{% highlight js %}
{% include files/other/wp_stage1.js %}
{% endhighlight %}
stage 2
{% highlight js %}
{% include files/other/wp_stage2.js %}
{% endhighlight %}

The code itself is pretty straightforward.
I'm using regular expressions to get the nonces and other values needed for editing posts, XHR for getting and submitting data along with regular javascript functions to ensure that our user is indeed logged in and has the priviledges we want.

### Demonstration
{% include ytplayer.html id="TQns7X0Ym-A" %}

