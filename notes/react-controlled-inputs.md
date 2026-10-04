# React Controlled Inputs

## `checked` on a checkbox — the mental model, built up from scratch

A checkbox has exactly one meaningful question: **"Is my box currently ticked or not?"** — a
plain `true`/`false`. In a *controlled* React input (React, not the browser, owns the truth),
you answer that question with the `checked` prop:

```jsx
<input type="checkbox" checked={true} />   // always ticked, no matter what
<input type="checkbox" checked={false} />  // always unticked
```

Make it dynamic — tie it to a real boolean expression instead of a hardcoded value:

```jsx
const isSubscribed = true;
<input type="checkbox" checked={isSubscribed} />
```

If `isSubscribed` is `true`, the box renders ticked. If it becomes `false` (through some state
update), React re-renders and the box visually unticks itself — you never touch the DOM
directly, you just change the boolean, and React syncs the checkbox to match.

### Applying this to an array instead of a plain boolean

Built for `ProfilePreferences.jsx`'s `genderPreference` (an array, e.g. `["female", "others"]`).
For the "Male" checkbox specifically, the real question is: **"is `'male'` one of the values
currently in this array?"** — exactly what `.includes()` answers:

```js
genderPreference.includes("male")     // → false  (not in the array)
genderPreference.includes("female")   // → true   (it IS in the array)
genderPreference.includes("others")   // → true   (it IS in the array)
```

So three separate checkboxes, each asking about its OWN value:

```jsx
<input type="checkbox" checked={genderPreference.includes("male")} />    {/* unticked */}
<input type="checkbox" checked={genderPreference.includes("female")} />  {/* ticked */}
<input type="checkbox" checked={genderPreference.includes("others")} />  {/* ticked */}
```

This correctly renders two boxes ticked and one empty, matching the array's actual contents —
without any one checkbox needing to know about the others.

## The `onChange` half — toggling modifies the array, it doesn't replace it with `e.target.value`

For the Male checkbox specifically, clicking it should mean: "if `'male'` is already in the
array, remove it; otherwise, add it." Worked example, starting from
`genderPreference = ["female"]`, clicking the Male checkbox:

```jsx
onChange={() => {
    if (genderPreference.includes("male")) {
        // already there → remove it
        setGenderPreference(genderPreference.filter((g) => g !== "male"));
    } else {
        // not there → add it
        setGenderPreference([...genderPreference, "male"]);
    }
}}
```

- Before click: `["female"]` → `.includes("male")` is `false` → takes the `else` branch →
  `[...genderPreference, "male"]` → `["female", "male"]`.
- Click again: now `.includes("male")` is `true` → takes the `if` branch →
  `.filter((g) => g !== "male")` keeps everything EXCEPT `"male"` → back to `["female"]`.

Notice `onChange` here takes **no `e` parameter at all** — unlike text inputs, nothing from the
event is needed; the handler already knows exactly which value (`"male"`) this specific
checkbox represents, hardcoded into the handler itself. Contrast with a text input's
`onChange={(e) => setFirstName(e.target.value)}`, where the whole point IS reading something
out of the event.

**General lesson:** a single-value input (`<select>`, a text `<input>`) naturally pairs with
`value={state}` + `onChange={(e) => setState(e.target.value)}` — the event tells you the new
whole value. A checkbox representing ONE member of a multi-value array pairs with
`checked={array.includes(thisValue)}` + a hardcoded toggle (`.filter()` to remove,
spread-and-append to add) — the event doesn't carry useful information here; what matters is
"does the array currently contain MY specific value," decided independently per checkbox.
