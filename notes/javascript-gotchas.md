# JavaScript / React Gotchas

## `Number(e.target.value)` on every keystroke breaks a controlled numeric input when cleared

Hit while building `ProfilePreferences.jsx`'s age/distance fields.

```jsx
<input
    type="number"
    value={minAge}
    onChange={(e) => setMinAge(Number(e.target.value))}
/>
```

**Symptom:** clearing the field doesn't leave it blank — it immediately snaps to showing `0`.
Typing a fresh number after that produces malformed values like `"018"` instead of `"18"`.

**Root cause:** `onChange` fires on *every* keystroke, including the instant the field becomes
empty. At that moment, `e.target.value` is `""` (empty string) — and `Number("")` evaluates to
`0`, not "nothing"/`NaN`. So clearing the input immediately re-renders it showing `0` (since the
input is controlled by that now-`0` state), instead of staying genuinely blank while you type a
replacement value.

Then, because the field is controlled by that `0`, the *next* keystroke gets inserted into the
DOM relative to the `"0"` that's already sitting there, before the browser's own number-input
normalization has a chance to strip the leading zero — producing visibly broken values like
`"018"` the browser would normally never allow you to type on its own.

**Fix:** don't convert to a number on every keystroke. Keep the **raw string** in state while
the user is actively typing — that lets the field be genuinely empty, show `"1"`, `"18"`,
whatever's actually been typed, with zero reformatting fighting the user mid-keystroke. Only
convert to a real `Number(...)` at the one point it actually needs to be a number: right before
sending it somewhere that cares about the type (e.g. the backend's `typeof === "number"` check
in `validateProfilePreference`).

```jsx
// onChange: store the raw string, no conversion
onChange={(e) => setMinAge(e.target.value)}

// Only convert at the point of actual use (e.g. building the PATCH body)
await axios.patch(url, { minAge: Number(minAge), ... }, {withCredentials:true})
```

**General lesson:** a controlled `<input type="number">`'s `value` doesn't need to actually BE
a JS number at every point in time — it just needs to be *something render-able as text* while
the user is interacting with it. Converting too early (on every keystroke) fights the user's
typing; converting too late (never) means whatever consumes the value downstream (an API, a
comparison) gets the wrong type. Convert exactly once, at the boundary where the type actually
matters — not at the boundary where the user is still mid-edit.

This is the frontend mirror of the backend's own `typeof`-checking lesson
(`javascript-gotchas.md` in the backend's `notes/` — comparing `req.body` values without
checking their type first) — same root idea, just encountered from the other side of the wire:
the backend was correctly strict about types; the bug was the frontend sending a string where a
number was expected, compounded by converting at the wrong moment once a fix was attempted.
