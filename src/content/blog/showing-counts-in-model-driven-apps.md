---
title: "Dataverse Tip: Showing Counts in Model-Driven Apps (It’s Easier Than It Looks)"
description: "I recently ran into this again while working on a Model-Driven app project, and I thought it’s worth sharing — because it’s one of those Dataverse things we…"
date: 2026-01-30
tags: [Dataverse, Model-driven apps]
source:
  name: LinkedIn
  url: https://www.linkedin.com/pulse/dataverse-tip-showing-counts-model-driven-apps-its-easier-murugan-xdfac/
---

This is not a new trick.

Not a hack.

And definitely not rocket science 🚀😄

I recently ran into this again while working on a **Model-Driven app** project, and I thought it’s worth sharing — because it’s one of those Dataverse things we *all* forget until it bites us again.

---

### 🧩 The Everyday Scenario

You have two tables:

- **Training Sessions**
- **Session Registrations**

Each session can have many registrations.

The ask from business is very normal:

> “Can we see the number of registrations directly in the Training Sessions list?”

Sounds harmless… until you switch from **Canvas** to **Model-Driven** 😅

---

### 😎 Canvas Apps: Life Is Easy

In a Canvas app, this is a non-issue:

- Filter registrations
- CountRows(...)
- Show the value

Done. Coffee break ☕

That’s why our brain naturally goes:

> “I’ll just use a Formula column in Dataverse.”

---

### ❌ Model-Driven Reality Check

Formula (Power Fx) / Calculated columns in Dataverse:

- Work at **row level**
- Are great for simple logic
- ❌ Are **not** meant for aggregation

So counting related records in a view using a formula column… Dataverse says: *“Nice try.”* 😄

---

### ✅ The Right Tool (and It’s Not Fancy)

For Model-Driven apps, the answer is simply:

👉 **Rollup Columns**

They are built exactly for:

- Counting related records
- Showing totals in views
- Sorting, filtering, and reporting

No hacks. No workarounds. Just using the platform as intended 👍

---

### 🧮 Example: Registration Count (Rollup)

### Step 1️⃣ Create a Rollup Column

On **Training Sessions**:

- Name: Registration Count
- Type: **Whole Number**
- Behavior: **Rollup**

---

### Step 2️⃣ Define the Rollup

- Related table: **Session Registrations**
- Relationship: Registration → Training Session
- Aggregate: **Count**
- Optional filters:

---

### Step 3️⃣ Add It to the View

- Open **Active Training Sessions** view
- Add Registration Count
- Save & publish

That’s it. No Power Fx gymnastics 🤸♂️ No late-night debugging 🌙

---

### ⏱️ A Small but Important Detail

Rollup columns:

- Recalculate automatically in the background (usually hourly ⏳)
- Are read-only (by design)

💬 **Quick tip:** If you don’t see a *“Recalculate Rollup”* button — don’t worry. As long as the rollup exists, Dataverse will handle recalculation for you.

---

### 🧠 The Simple Rule That Always Helps

Whenever I work with Model-Driven apps, I keep this in mind:

🧩 **Formula Columns = Row-level logic** 🧮 **Rollup Columns = Aggregation logic**

Once you remember this, Dataverse becomes much more predictable — and a lot less frustrating 😄

---

### 🏁 Final Thought

This isn’t a new feature. It’s not complicated. It’s just one of those **Dataverse basics** that’s easy to overlook — especially if you spend most of your time in Canvas apps (guilty 🙋♂️).

I hit this again in my recent project, so I figured I’d share it — in case it saves someone else a few minutes (or hours).

If this sounds familiar, you’re definitely not alone 👍
