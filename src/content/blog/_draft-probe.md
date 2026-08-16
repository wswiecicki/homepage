---
title: 'Draft probe — must never be published'
pubDate: 2099-01-01
description: 'Fixture post used by the check suite to verify draft exclusion. Should never appear in dist/.'
author: 'Wojciech'
tags: ['draft-probe-only-tag']
draft: true
---

This post exists only so `scripts/check-site.test.mjs` can assert that draft
posts never leak into the build output. It must never be reachable in
`dist/`.
