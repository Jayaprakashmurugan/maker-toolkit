---
title: "Lookups in Dataverse Flows: GUID, Expand Query or FetchXML?"
description: "Before you add another Get a row inside a loop, ask what you actually need from the lookup. Here's how to pick between the lookup ID, Expand Query and FetchXML in Power Automate."
date: 2026-11-03
tags: [Power Automate, Dataverse, OData]
---

### Every Dataverse flow hits this sooner or later.

You list some rows. Each row has a lookup. And you need something from the row that lookup points to.

So you do the obvious thing:

**List rows** ⬇️ **Apply to each** ⬇️ **Get a row by ID**

It works. Nothing wrong with it on day one.

But every loop is one more call to Dataverse. Fifty opportunities, fifty extra calls. Five thousand, and your flow is going to take a while. 😅

The fix isn't always Expand Query, though. It depends on what you need from the lookup.

So let's start there.

---

## First question: what do you need from the lookup?

| You need | Use |
| --- | --- |
| Just the ID of the related row | The lookup value you already have |
| A few columns from the related row | **Expand Query** |
| A real query across tables, or you already have FetchXML | **Fetch Xml Query** |

Let's go through them with one example: a flow that lists **opportunities** and needs details about each one's account and contact.

---

## Option 1: you only need the ID

This one gets skipped all the time.

Every lookup on the row comes back with its GUID, as a column named like `_parentaccountid_value`. If all you need is to update the account, link it to another row, or pass it to a child flow, you already have it.

Add it to **Select columns**:

```text
name,estimatedvalue,_parentaccountid_value
```

No expand. No extra call. Done.

---

## Option 2: you need a few columns from the related row

Now you want the account's name and phone number on each opportunity. This is where **Expand Query** comes in.

Here's the one thing to get right: Expand Query doesn't use the `_parentaccountid_value` name. It uses the **navigation property**, which for most lookups is the same name without the underscores and `_value`: `parentaccountid`. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/web-api-navigation-properties)

In the **List rows** action for opportunities:

- **Select columns**: `name,estimatedvalue`
- **Expand Query**:

```text
parentaccountid($select=name,telephone1),parentcontactid($select=fullname,emailaddress1)
```

One action, and every opportunity comes back with its account and contact inside it. [Microsoft Learn](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows)

Always put a `$select` inside the brackets. If you only write the navigation property, you get **every** column of the related row.

### Reading the expanded values

Each opportunity now has a `parentaccountid` object inside it, with `name` and `telephone1`.

I wouldn't rely on dynamic content for these. An expression always works:

```js
items('Apply_to_each')?['parentaccountid']?['name']
```

The `?` matters. If an opportunity has no account, the expanded value is empty, and without `?` the expression fails the whole run.

Not sure about the exact path? Run the flow once, copy the List rows output from the run history, and paste it into the [Expression Picker](/json-expression-picker/). Click the value you want and it gives you the expression. 🙂

### Customer lookups point to two tables

Some lookups can point to more than one table. **Customer** on an opportunity can be an account **or** a contact.

For these, the navigation property includes the table name, and there's one per table: `customerid_account` and `customerid_contact`. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/web-api-navigation-properties)

You can expand both:

```text
customerid_account($select=name),customerid_contact($select=fullname)
```

Only one of them will have a value on each row. So pick whichever is filled with [coalesce](/expression-reference/coalesce/):

```js
coalesce(items('Apply_to_each')?['customerid_account']?['name'], items('Apply_to_each')?['customerid_contact']?['fullname'])
```

### Going the other way: child rows

Expand works in the other direction too. From an account, you can pull its related rows, like its tasks.

This example is straight from Microsoft's docs, and it shows the options you can put inside the brackets, separated by `;`:

```text
Account_Tasks($select=subject;$filter=contains(subject,'Task');$orderby=createdon desc)
```

Be careful with this direction. Microsoft says up to 5,000 related rows can come back for **each** expanded collection, so use `$filter` and `$top` to keep it small. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/join-tables)

---

## Option 3: you need a real query, or you already have FetchXML

**List rows** also has a **Fetch Xml Query** field. If you already built the query somewhere else, for example in FetchXML Builder in XrmToolBox, you can paste it straight in and join tables with `link-entity`.

Two things to know before you choose it:

- Aggregation queries don't work with FetchXML in List rows. `distinct` does.
- The **Pagination** setting doesn't apply to FetchXML. For more than 5,000 rows, you handle the paging in the query yourself. [Microsoft Learn](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows)

For a simple "give me the account name too", Expand Query is easier to read and easier to change later.

---

## Limits worth knowing

A few from Microsoft's docs that save you a confusing afternoon:

- Up to **15** `$expand` options in one query. Each one is a join, so fewer is faster.
- Inside a **nested** expand (an expand inside an expand), `$top` and `$orderby` don't work, and many-to-many relationships aren't supported.
- Expanded child rows can come back slightly out of date, because they may be cached.
- **List rows** returns 5,000 rows per page by default. Turn on **Pagination** in the action's settings to get more, up to 100,000.
- **Filter rows** must not include `$filter=`. That prefix is only for calling the API directly. [Microsoft Learn](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows)

If you're building the **Filter rows** part too, the [OData Filter Builder](/odata-filter-builder/) writes it for Dataverse, with the right quotes and formats.

---

## The short version

Before you add a **Get a row by ID** inside a loop, ask one question: what do I actually need from this lookup?

- **The ID?** It's already there as `_name_value`.
- **A few columns?** Expand Query, with a `$select`.
- **A proper query across tables?** FetchXML.

One List rows call instead of hundreds. Your flow runs faster, and your run history gets a lot shorter to read. 😄
