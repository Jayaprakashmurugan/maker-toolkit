---
title: "When Patch Fails: Turning Power Apps Errors into Messages Users Understand"
description: "A save button that tells users what actually went wrong, one IfError pattern you can copy, the semicolon trap, and App.OnError for the errors you didn't plan for."
date: 2026-11-03
tags: [Power Apps, Power Fx, Error handling]
---

### "It just says something went wrong."

That's the message nobody wants from a user.

Usually it means one of two things. The save failed and the app said nothing at all. Or it showed a red banner with a technical message the user had no idea what to do with.

Both are fixable with a few lines of Power Fx.

Let's build one save button properly, step by step. 🙂

---

## Step 0: check one setting in older apps

Everything below depends on **formula-level error management**.

It's on by default in new apps. But some older apps have it switched off. Open the app, go to **Settings** > **Updates** > **Retired**, and make sure **Disable formula-level management** is turned **off**. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/error-handling)

If it's off, [IfError](/formula-reference/iferror/) and friends won't work the way you expect.

---

## Step 1: catch the error

Start with the plain save. A **Save** button that creates an expense:

```powerfx
Patch(
    Expenses,
    Defaults(Expenses),
    { Title: txtTitle.Text, Amount: Value(txtAmount.Text) }
)
```

If this fails, the user gets the default error banner, and the screen just stays where it is.

Wrap it in [IfError](/formula-reference/iferror/):

```powerfx
IfError(
    Patch(
        Expenses,
        Defaults(Expenses),
        { Title: txtTitle.Text, Amount: Value(txtAmount.Text) }
    ),
    Notify(
        "The expense wasn't saved: " & FirstError.Message,
        NotificationType.Error
    )
)
```

Now you decide what happens when it fails. Inside the second argument, `FirstError` tells you what went wrong: its `Kind`, a `Message`, and where it came from. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-iferror)

Microsoft calls `IfError` the preferred way to handle errors from [Patch](/formula-reference/patch/). [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-patch)

---

## Step 2: say something useful

`FirstError.Message` is better than nothing. But it's written for makers, not for the person filling in an expense.

`FirstError.Kind` is where it gets useful. It tells you the **type** of error, so you can answer with a message that fits:

```powerfx
IfError(
    Patch(
        Expenses,
        Defaults(Expenses),
        { Title: txtTitle.Text, Amount: Value(txtAmount.Text) }
    ),
    Notify(
        Switch(
            FirstError.Kind,
            ErrorKind.MissingRequired,
                "Please fill in all the required fields.",
            ErrorKind.Validation,
                FirstError.Message,
            ErrorKind.Network,
                "You seem to be offline. Nothing was saved.",
            ErrorKind.CreatePermission,
                "You can't add expenses. Ask your admin for access.",
            "Something went wrong: " & FirstError.Message
        ),
        NotificationType.Error
    ),
    Notify("Expense saved.", NotificationType.Success);
    Navigate(scrExpenses)
)
```

A few things happening here:

- For **Validation**, the data source's own message is usually the clearest, so we just show it.
- The last value in the `Switch` is the fallback, for any kind we didn't plan for.
- The third argument of `IfError` only runs when there was **no** error. That's where the success message and the navigation go.

Here are the kinds you'll see most often when saving:

| ErrorKind | What it means for the user |
| --- | --- |
| `MissingRequired` | A required field is empty |
| `Validation` | A value isn't allowed, like a number out of range |
| `Network` | No connection while saving |
| `CreatePermission` | They're not allowed to create this record |
| `Conflict` | Someone else changed the record first |

One note on `Conflict`: Microsoft says Power Apps doesn't check for conflicts on Dataverse tables, so you'll mostly meet this one with other data sources. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-errors)

The full list of kinds is in the [error handling docs](https://learn.microsoft.com/en-us/power-platform/power-fx/error-handling).

---

## Step 3: check before you even call Patch

The cheapest error is the one you never send to the data source.

If the title is empty, there's no reason to try:

```powerfx
If(
    IsBlank(txtTitle.Text),
    Notify("Please give the expense a title.", NotificationType.Warning),
    IfError( ... ) // the whole IfError block from step 2
)
```

Even better, disable the button until the form is valid. Set its **DisplayMode**:

```powerfx
If(
    IsBlank(txtTitle.Text) || IsBlank(txtAmount.Text),
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

Users can't hit an error they can't trigger. 😄

---

## The semicolon trap

This one surprises people.

When you chain actions with `;`, the next one still runs even if the one before it failed.

```powerfx
Patch(Expenses, Defaults(Expenses), { Title: txtTitle.Text });
Patch(AuditLog, Defaults(AuditLog), { Action: "Expense created" })
```

If the expense fails, the audit log still says "Expense created". Not great.

`IfError` can take pairs of "do this" and "if it fails, do that". It runs them in order and **stops at the first failure**:

```powerfx
IfError(
    Patch(Expenses, Defaults(Expenses), { Title: txtTitle.Text }),
    Notify(
        "The expense wasn't saved: " & FirstError.Message,
        NotificationType.Error
    ),

    Patch(AuditLog, Defaults(AuditLog), { Action: "Expense created" }),
    Notify(
        "The expense was saved, but the audit entry failed.",
        NotificationType.Warning
    )
)
```

Now the audit entry is only written when the expense really exists. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-iferror)

---

## App.OnError: for the errors you didn't plan for

You won't wrap every formula in `IfError`. That's fine.

**App.OnError** runs whenever an error isn't handled anywhere else. It's one place for the whole app, and it's perfect for logging:

```powerfx
Trace(
    "Unhandled error: " & FirstError.Message,
    TraceSeverity.Error,
    { Kind: FirstError.Kind, Source: FirstError.Source }
);
Error(FirstError)
```

[Trace](/formula-reference/trace/) writes the error to Monitor, and to Application Insights if you've connected it. That last line, `Error(FirstError)`, passes the error on so the user still sees the usual banner.

Leave it out, and the banner doesn't show. That can be what you want, but be careful: hiding errors from users is how silent failures start.

And one thing App.OnError **can't** do: fix the error. By the time it runs, the error has already happened. It only decides how it's reported and gives you a place to log it. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/error-handling)

---

## A few small things about Notify

[Notify](/formula-reference/notify/) has more options than most people use:

- `NotificationType.Error`, `Warning`, `Success` or `Information` (the default).
- A message stays for **10 seconds** by default. Pass a third argument in milliseconds to change it, or `0` to keep it on screen until the user closes it.
- Messages are limited to **500 characters**. [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-showerror)

For an error the user really needs to read, `0` is a good choice.

And if you'd rather show the error on the form itself instead of a banner, the [Errors](/formula-reference/errors/) function gives you the errors for a data source and record, ready for a label.

---

## The short version

1. Make sure **formula-level error management** is on.
2. Wrap every save in **IfError**, and use the third argument for what happens on success.
3. Switch on **FirstError.Kind** to give messages people understand.
4. Use **IfError pairs** instead of `;` when one save depends on another.
5. Add **App.OnError** to log what you didn't catch, and pass it on with `Error(FirstError)`.

Your users won't notice any of this when it works.

They'll only notice that, when something goes wrong, the app finally tells them what to do. 🙌
