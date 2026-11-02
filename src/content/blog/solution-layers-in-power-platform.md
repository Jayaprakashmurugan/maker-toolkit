---
title: "Which Change Wins? Reading Solution Layers in Power Platform"
description: "You imported the new managed version, but the app still behaves like the old one. Solution layers tell you why, and they're easier to read than they look."
date: 2026-11-03
tags: [ALM, Dataverse, Solutions]
---

### The release went in. The change didn't show up.

You know this one.

You export the managed solution, import it into Test, and everything looks fine.

Same solution, same version, into Production.

And there, the form still shows the old layout. Or a column is still optional when it should be required.

The import succeeded. Nothing is broken.

So where did your change go? 🤔

Most of the time the change is there. It just isn't the one **winning**.

That's what solution layers are about.

---

## Every component has its own stack

This is the part worth getting right first.

Layers aren't something a solution has. They're something each **component** has.

Every table, column, form, view and app in Dataverse carries its own little pile of definitions, one for each solution that touched it.

For a single column, the stack could look like this:

```text
Unmanaged layer        <- edits made directly in this environment
ExpenseCore_Upgrade    <- a staged upgrade, waiting to be applied
ExpenseCore patch      <- patches, newest on top
ExpenseCore            <- your managed solution
System                 <- what Dataverse ships with
```

Read it from the bottom up:

- **System** is the base. It holds the tables and components the platform needs to work.
- **Managed solutions** sit on top of it, in the order they were installed. The last one installed is above the ones before it, so it can customize them.
- **Patches** stack on top of their parent, newest on top. A staged upgrade adds its own layer above those.
- The **unmanaged layer** is always on top. And there's only one of it: every unmanaged solution and every ad-hoc change in that environment shares it.

[Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/solution-layers-alm) has the full picture, but this stack is all you need in your head.

---

## The rule: top wins

For most components, the layer at the top decides how the component behaves at runtime.

Not the newest import. Not the highest version number.

**The top layer.**

So if someone changed that column directly in Production last month, the unmanaged layer is sitting on top of your managed solution. Your new release went in underneath it, and the old change keeps winning.

There are exceptions, though. **Model-driven apps, forms and site maps merge.** Dataverse combines their layers instead of picking just one.

That's why a form can end up with a mix of fields from two different solutions. If you don't want that, Microsoft's own advice is to create new forms for your tables, or to put new fields in a new tab or section instead of rearranging the ones a managed solution owns. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/how-managed-solutions-merged)

---

## Where to look

You don't have to guess any of this. The stack is right there in the maker portal.

1. Go to **Solutions** and open the solution.
2. Select the component, for example the **Account** table or one of its columns.
3. On the command bar, select **Advanced** > **See solution layers**.

You get every layer for that component, with the most recent one at the top. That's the active layer, the one deciding the behavior.

Select a layer and look at the **Updated** tab. It shows only the properties that layer changed. **All Properties** shows everything.

If the **Solution** column says **Unmanaged layer** at the top, you've found your answer.

---

## How the unmanaged layer gets into Test and Prod

Nobody plans for it.

It usually starts with a small, urgent fix. A typo in a label. A field that should be required. Someone opens the environment, makes the change, publishes, done.

It works. Everyone moves on.

But that change now lives in the unmanaged layer, outside any release. It's not in source control. Your dev environment doesn't have it. And it sits on top of every managed import that comes after it.

It also creates a dependency. Once a managed component has been edited, that managed solution can't be uninstalled until the dependency is removed. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm)

Microsoft says it plainly: in most situations you don't want unmanaged customizations deciding how your components behave in Test and Production.

---

## Removing it, carefully

When you find an unmanaged layer you don't want, you can remove it:

1. Open **See solution layers** for the component.
2. Select the **Unmanaged layer** row.
3. Select **Remove active customizations** on the command bar.

Before you click it, read this twice:

⚠️ **It can't be undone.** Microsoft warns that data associated with the unmanaged customization can be lost.

So first make sure the fix you actually want is in your development solution and has gone out in a managed release. Then remove the layer, and the managed definition underneath takes over.

One more catch: if the unmanaged layer is the **only** layer, which means the component was created directly in that environment, you can't remove it this way. You'd have to delete the component itself. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/solution-layers)

---

## Update, upgrade or stage: what each one does to the stack

When you import a newer version of a managed solution that's already installed, Dataverse asks how you want to apply it. That choice changes the stack.

| Option | What happens | Components you removed |
| --- | --- | --- |
| **Update** | Goes onto the existing managed solution | Stay. An update can't delete anything |
| **Upgrade** | Rolls the solution and its patches into one new version | Deleted if they're not in the new version |
| **Stage for upgrade** | Adds a new top layer named *_Upgrade* | Deleted when you select **Apply upgrade** |

**Apply upgrade** flattens those layers into a new base solution. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm)

My rule here is simple: if a release removes something, use **Upgrade**. With **Update**, the old column or flow stays behind, and a few months later someone asks why it's still there.

And patches? They can add or update components on top of their parent, but they can't delete anything. Microsoft doesn't recommend them anymore, so I don't plan releases around them. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/update-solutions-alm)

---

## Security roles play by their own rules

Quick one, because it catches people out.

Don't change Dataverse's predefined security roles inside your own solution. Those changes get removed when the system updates its predefined roles. Make a copy of the role and manage the copy in your solution instead.

And for your custom roles, an import **replaces** the role. It doesn't merge it. So keep each custom role in one solution. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/alm/how-managed-solutions-merged)

---

## My checklist before I blame the deployment

When a change doesn't show up after an import, I go through this, in this order:

1. Open **See solution layers** on the exact component. Not the solution, the component.
2. Is there an **Unmanaged layer** at the top? That's the usual suspect.
3. Is the solution version you expect actually in the stack?
4. Is there an *_Upgrade* layer still waiting for **Apply upgrade**?
5. Is it a form, site map or app? Then check which other solutions are merging into it.
6. Was another managed solution installed after yours, on top of it?

Only after all six do I start doubting the import itself. 😄

---

## The short version

Solution layers sound like ALM theory. They're not.

They're the first thing to check when something works in one environment and not in another.

Build in an unmanaged dev environment, ship managed, and keep the unmanaged layer out of Test and Production.

And when something looks wrong, open the stack before you open a support ticket.
