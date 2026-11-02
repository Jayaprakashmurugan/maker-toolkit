---
title: "TypeScript for Power Fx People: You Already Know More Than You Think"
description: "If you write Power Fx, you already think in types. Here's TypeScript explained through formulas you use every day, and the three places it already shows up in Power Platform."
date: 2026-11-03
tags: [TypeScript, Power Fx, Code Apps]
---

### You've been writing typed code for years. You just didn't call it that.

Ever written a formula, and Power Apps underlined it in red before you even ran the app?

You compared a number with text. Or used a column that doesn't exist. Or passed a record where a table was expected.

That's a type check.

Microsoft describes Power Fx as **strongly typed**: the types of all values are known when you write the formula, so mistakes show up early and IntelliSense knows what to suggest. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/overview)

TypeScript does exactly the same thing for JavaScript.

So if you're a Power Fx maker looking at TypeScript and thinking "this is for pro developers", it really isn't that far from what you already do. 🙂

---

## Where TypeScript is already hiding in Power Platform

You don't need a new project to start. TypeScript is already in three places you might touch:

- **PCF code components.** You create one with `pac pcf init`, and the logic goes in `index.ts`. The component class implements `ComponentFramework.StandardControl<IInputs, IOutputs>`, with `init`, `updateView`, `getOutputs` and `destroy`. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)
- **Office Scripts.** Excel automation scripts are TypeScript, and you can run them from a flow with the **Run script** action of the Excel Online (Business) connector. [Microsoft Learn](https://learn.microsoft.com/en-us/office/dev/scripts/develop/power-automate-integration)
- **Code apps.** When you add Dataverse or a connector to a code app, the CLI generates TypeScript models for your tables. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-data)

Three different tools. Same language.

That's a pretty good reason to learn it once.

---

## Power Fx to TypeScript, one idea at a time

### Text, Number, Boolean

The basics map almost one to one:

```ts
const title: string = 'Taxi to the airport';
const amount: number = 42.5;
const approved: boolean = false;
```

And just like Power Fx, you usually don't have to write the type. TypeScript works it out from the value:

```ts
const amount = 42.5; // TypeScript already knows this is a number
```

Power Fx does the same thing. Microsoft calls it type inference: types come from how a value is used, without being declared. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/overview)

So you write types where they actually help: the shape of your data, and the inputs of your functions.

### A record is an object

A record in Power Fx is a set of named fields. In TypeScript, you describe that shape once and reuse it:

```ts
type Expense = {
  id: string;
  title: string;
  amount: number;
  status: Status;
  receiptUrl?: string; // ? = optional, like a blank column
};
```

You'll also see `interface Expense { ... }` in other people's code. For a shape like this, both work. Pick one and stay consistent.

### A table is an array

And a table of records is just an array of that type: `Expense[]`.

The functions you use every day have close cousins:

```powerfx
Filter(Expenses, Status = "Submitted")
LookUp(Expenses, ID = varSelectedID)
ForAll(Expenses, Title)
Sum(Expenses, Amount)
```

```ts
const submitted = expenses.filter((e) => e.status === 'Submitted');
const selected = expenses.find((e) => e.id === selectedId);
const titles = expenses.map((e) => e.title);
const total = expenses.reduce((sum, e) => sum + e.amount, 0);
```

Once you see `filter`, `find` and `map` as Filter, LookUp and ForAll, half of the JavaScript you read suddenly makes sense. 😄

### A choice column is a union type

Here's the one I like most.

A choice column only allows certain values. TypeScript can do the same thing with a **union type**:

```ts
type Status = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
```

Now if you write `status === 'Aproved'` with a typo, TypeScript tells you straight away. That value can never happen.

It's the same feeling as typing `Color.` in Power Apps and only getting real colors in the list.

### Blank is undefined (and Coalesce has a catch)

In Power Fx, any value can be blank. In TypeScript you'll meet `undefined` and `null` for the same idea.

Two operators make it easy:

```ts
const receipt = selected?.receiptUrl; // no crash if selected is undefined
const label = receipt ?? 'No receipt'; // fallback when it's missing
```

`?.` is like reading `LookUp(...).Title` in Power Fx: if there's no record, you get blank instead of an error.

And `??` looks a lot like `Coalesce()`. But careful, they're not the same:

- `Coalesce()` skips blank **and** empty text. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-isblank-isempty)
- `??` only skips `null` and `undefined`. An empty string `''` still wins.
- `||` skips empty strings too, but it also skips `0` and `false`.

So if an empty string should count as "nothing", `??` alone won't do what `Coalesce` did. Easy to miss when you're moving a formula over. 😅

### `unknown` is ParseJSON's Dynamic

When you call `ParseJSON()` in Power Fx, you get a **Dynamic** value back (it used to be called UntypedObject). You can't use it directly. You convert it first with `Text()`, `Value()` and friends. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/data-types)

TypeScript has the same idea. It's called `unknown`, and it forces you to check a value before you use it.

There's also `any`, which simply switches type checking off. Avoid it. Office Scripts doesn't even allow it: both explicit and implicit `any` are reported as errors. [Microsoft Learn](https://learn.microsoft.com/en-us/office/dev/scripts/develop/typescript-restrictions)

---

## Your first real TypeScript: an Office Script

If you want to try all of this today, Office Scripts are the easiest place. No install, no project. Open a workbook in Excel for the web and create a new script from the **Automate** tab.

This one adds up column B of the active sheet, skipping the header row:

```ts
function main(workbook: ExcelScript.Workbook): number {
  const sheet = workbook.getActiveWorksheet();
  const rows = sheet.getUsedRange().getValues().slice(1);

  let total = 0;
  for (const row of rows) {
    total += Number(row[1]);
  }

  return total;
}
```

Look at the types in there: `workbook` is an `ExcelScript.Workbook`, and the function promises to return a `number`.

Run it from a flow with **Run script**, and that number comes back to the flow. Now Power Automate and TypeScript are working together. 🙌

---

## Three habits that help

**Leave strict mode on.** Microsoft's code app template already has `"strict": true` in its TypeScript config. It's the setting that catches the most mistakes, so don't turn it off when the red lines appear.

**Hover before you type.** In VS Code, hover over any variable and you'll see what TypeScript thinks it is. Most of the time you don't need to write anything.

**Use the types you're given.** PCF generates `IInputs` and `IOutputs` from your manifest, and code apps generate a model for every table. Don't write your own copies. When the table changes, you regenerate, and TypeScript shows you every place that needs fixing.

---

## The short version

TypeScript isn't a new way of thinking for a Power Fx maker. It's the same way of thinking, in a different language.

Records become objects. Tables become arrays. Choice columns become union types. Blank becomes `undefined`.

And the red underline you already know from Power Apps? That's TypeScript doing its job.

Start with one small Office Script. You'll be surprised how much you already know.
