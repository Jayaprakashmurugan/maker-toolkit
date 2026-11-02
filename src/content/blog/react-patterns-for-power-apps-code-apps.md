---
title: "React Patterns in Power Apps Code Apps: Which Ones Actually Matter?"
description: "Code apps are React apps with Power Platform underneath. A few React patterns become essential, some replace things canvas apps gave you for free, and some you can skip."
date: 2026-11-03
tags: [Code Apps, React, Power Apps]
---

### Short answer: yes, it matters. But not every pattern on the usual list.

If you search for "React patterns", you get the same list every time.

Custom hooks. Compound components. Render props. Portals. Memoization. Ten or more of them.

All useful. But when you're building a **Power Apps code app**, they don't all carry the same weight.

Some of them you'll use on every single screen.

Some you'll use once.

And some you can happily ignore until the day you actually need them.

So let's go through them from a Power Platform point of view. 🙂

---

## First, what you're actually building

A code app is a web app you build in VS Code with a framework like React, and then run on Power Platform. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview)

The platform gives you three things you'd normally have to build yourself:

- **Sign-in.** The Power Apps host handles end-user authentication and loading the app.
- **Data.** You add a data source with the CLI (`pa app add data-source`), and it generates TypeScript models and services for it, built on the client library `@microsoft/power-apps`. Your app talks to Dataverse or a connector through those services. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture)
- **Deployment.** `pa app push` publishes the app, and it can go into a solution.

Everything else is **yours**. How screens are split, where state lives, what happens when a call fails.

And that's exactly where React patterns come in.

One more thing before we start: end users need a Power Apps Premium license (or pay-as-you-go, an App Pass, or auto-claim) to run a code app. Worth knowing before you pitch one. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview)

---

## 1. Wrap every data source in a custom hook

**Verdict: use it. Always.**

This is the one pattern I'd never skip in a code app.

The generated services are great, but they shouldn't be called from inside your components. Put each one behind a hook that owns the loading state, the error and the data.

Here's what that looks like for active accounts in Dataverse:

```ts
import { useEffect, useState } from 'react';
import { AccountsService } from '../generated/services/AccountsService';
import type { Accounts } from '../generated/models/AccountsModel';

export function useActiveAccounts() {
  const [accounts, setAccounts] = useState<Accounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    AccountsService.getAll({
      select: ['accountid', 'name', 'address1_city'],
      filter: 'statecode eq 0',
      orderBy: ['name asc'],
      top: 50,
    })
      .then((result) => {
        if (!cancelled) setAccounts(result.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load accounts.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { accounts, loading, error };
}
```

Why this matters so much in a code app:

- When the table changes, you run `pa app refresh data-source` and the generated files change. With hooks, you fix one file, not twenty screens.
- Every screen gets the same loading and error handling for free.
- Look at that `select`. If you've built canvas apps, this is your delegation mindset coming back. Ask only for the columns and rows you need. Microsoft's own Dataverse sample says the same: always use `select`. [GitHub sample](https://github.com/microsoft/PowerAppsCodeApps/tree/main/samples/Dataverse)

---

## 2. Keep your screens dumb

**Verdict: use it.**

Once the data lives in a hook, the component that shows it can be very simple. Data in through props, events out through callbacks.

```tsx
type Props = {
  accounts: Accounts[];
  onSelect: (id: string) => void;
};

export function AccountList({ accounts, onSelect }: Props) {
  return (
    <ul>
      {accounts.map((a) => (
        <li key={a.accountid}>
          <button onClick={() => onSelect(a.accountid)}>{a.name}</button>
        </li>
      ))}
    </ul>
  );
}
```

And the screen just connects the two:

```tsx
export function AccountsScreen() {
  const { accounts, loading, error } = useActiveAccounts();

  if (loading) return <p>Loading accounts...</p>;
  if (error) return <p role="alert">{error}</p>;

  return <AccountList accounts={accounts} onSelect={openAccount} />;
}
```

If you've built canvas components with custom input and output properties, this will feel familiar. Same idea, just in TypeScript.

The nice side effect: `AccountList` doesn't know Dataverse exists. You can test it, reuse it, or show it with sample data while the real table is still being designed.

---

## 3. Validate the form yourself

**Verdict: use it.**

In a canvas app, a form control does a lot of work for you. Required fields, data types, error messages next to the field.

In a code app, nobody does that for you.

So use controlled inputs and check the values **before** you call `create` or `update`:

```tsx
const [name, setName] = useState('');
const nameError = name.trim() === '' ? 'Account name is required.' : null;

async function save() {
  if (nameError) return;
  await AccountsService.create({ name: name.trim() });
}
```

Don't count on Dataverse to catch everything for you. And even when it does, a clear message next to the field is a much better experience than a failed save. 😅

For longer forms, like a multi-step request with a draft, submitted and approved state, `useReducer` keeps the logic in one place instead of ten `useState` calls fighting each other.

---

## 4. Read the app context once and share it

**Verdict: use it when your app needs it.**

The client library has `getContext()`, which tells your app things like the query parameters it was opened with. Microsoft has a sample that uses it to pick the first page to show. [GitHub sample](https://github.com/microsoft/PowerAppsCodeApps/tree/main/samples/DataverseContextRouting)

```ts
import { getContext } from '@microsoft/power-apps/app';

const context = await getContext();
const startPage = context.app.queryParams.page ?? 'accounts';
```

Canvas app makers: this is your `Param("page")`. 😄

Read it once, near the top of the app, and pass what you need down with React context. Don't call it again in every component.

---

## 5. Add an error boundary per screen

**Verdict: use it.**

The Power Apps host shows a message if your app **fails to load**. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture)

But if one screen throws while rendering, React unmounts everything and your users get a blank page. No message, no idea what happened.

An error boundary around each screen keeps the damage small:

```tsx
import { Component, type ReactNode } from 'react';

export class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed
      ? <p role="alert">Something went wrong on this screen. Refresh to try again.</p>
      : this.props.children;
  }
}
```

Yes, it's still a class component in React. Or use a small library like `react-error-boundary` if you prefer.

Think of it as the `IfError` you wrap around a risky formula, but for a whole screen.

---

## 6. Lazy load the heavy screens

**Verdict: sometimes.**

If your app has one big screen, say a reporting page with a chart library, there's no reason to make every user download it on startup.

```tsx
import { lazy, Suspense } from 'react';

const ReportsScreen = lazy(() => import('./screens/ReportsScreen'));

<Suspense fallback={<p>Loading reports...</p>}>
  <ReportsScreen />
</Suspense>
```

For a small app with three screens, don't bother. It's extra code for nothing.

---

## 7. Memoization, render props, compound components, portals

**Verdict: skip them until you have a reason.**

These are real patterns and they solve real problems. They're just not where most code apps hurt.

- **`useMemo` and `useCallback`**: only when you can actually see a slow render. A list of 50 accounts is not that.
- **Render props and compound components**: you'll mostly use them through a component library, not write them yourself. Microsoft's samples even include one built with Fluent UI. [GitHub samples](https://github.com/microsoft/PowerAppsCodeApps/tree/main/samples)
- **Portals**: the dialogs and tooltips in those libraries already use them for you.

Learn them, sure. Just don't start a code app by building your own tabs component. 🙃

---

## If you're coming from canvas apps

This is the part I find most helpful. Most of these patterns aren't new ideas at all. They're things canvas apps already gave you, now in your hands:

| In a canvas app | In a code app |
| --- | --- |
| Collections and variables | State inside a custom hook |
| Components with custom properties | Props in, callbacks out |
| `Param("page")` | `getContext()` and `app.queryParams` |
| Form control validation | Controlled inputs and your own checks |
| `Notify()` and `IfError()` | An error state, plus an error boundary |
| Delegation warnings | `select`, `filter` and `top` on every `getAll` |

---

## So, does it matter?

Yes.

The platform takes care of sign-in, connections and deployment. That's a lot.

But the structure of your app is still on you. And a code app without these patterns ends up like a canvas app where every screen has its own copy of the same formula.

If you only take three things from this post:

1. **One hook per data source.** Components never call the generated services directly.
2. **Validate before you save.** Nobody else will.
3. **An error boundary on every screen.** A friendly message beats a blank page.

Everything else, add it when the app asks for it.

And one last tip that isn't a React pattern at all: the built app is served from a publicly accessible endpoint, and Microsoft says not to store sensitive user or organizational data in the app. The same goes for secrets. [Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview)
