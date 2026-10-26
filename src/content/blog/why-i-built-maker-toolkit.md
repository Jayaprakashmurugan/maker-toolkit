---
title: Why I built Maker Toolkit
description: A free set of browser tools for Power Apps, Power Automate and Dataverse makers, and what's coming next on the blog and YouTube.
date: 2026-10-26
tags: [Maker Toolkit, Power Platform]
# Drafts show only when you run the site locally. Change to false when the post is ready to publish.
draft: true
---

<!--
  This is a starter draft. Rewrite it in your own words, then set draft: false above.
  Everything below is a suggestion for structure, not finished text.
-->

## The problem

Write a few lines about the moment that started this: a formula you couldn't find, a flow that kept running in a loop, or a schema that failed on nulls.

## What's in the toolkit

Maker Toolkit has free references and tools that run entirely in the browser:

- **References** for every Power Apps formula, Power Automate expression and desktop flow formula.
- **Builders** for trigger conditions, OData filters, Adaptive Cards and HTML email tables.
- **Helpers** that turn JSON into expressions, test regular expressions against Power Fx rules and convert SVG icons into Image formulas.

Nothing you type leaves your browser, and there's no sign-up.

## A quick example

A trigger condition that starts a flow only for new SharePoint items:

```js
@equals(triggerOutputs()?['body/Created'], triggerOutputs()?['body/Modified'])
```

## What's next

Say what you plan to write and record: guides that go with each tool, and short videos that show them in a real app or flow.
