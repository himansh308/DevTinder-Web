# Browser APIs — Geolocation

## `navigator.geolocation` needs no import — it's a browser GLOBAL, not a library

```js
navigator.geolocation.getCurrentPosition(successFn, errorFn);
```

No `import` statement, no npm package. `navigator` is an object the **browser itself**
provides to every page's JavaScript automatically — same category as `window`, `document`,
`localStorage`. `.geolocation` is one specific built-in capability (the Geolocation Web API)
hanging off it. Open any webpage's DevTools console and type `navigator.geolocation` — it's
already there, zero setup, in every modern browser.

**Only works in a secure context** — HTTPS, or `localhost` specifically (browsers treat
`localhost` as an exception for local development). This is why it works fine while developing
at `localhost:5173` with no HTTPS setup — but would silently stop working if this app were ever
deployed to a real domain over plain HTTP instead of HTTPS.

## `getCurrentPosition` is callback-style, NOT Promise-based — unlike `axios`/`fetch`

```js
navigator.geolocation.getCurrentPosition(
    (position) => { /* success */ },
    (error) => { /* failure/denial */ }
);
```

No `await`, no `.then()`. You pass TWO plain functions directly as arguments — the browser
calls whichever one applies once it has an answer (after the user responds to the permission
prompt, or immediately if a decision was already made previously).

- Success callback receives `position.coords.latitude` / `position.coords.longitude` —
  **latitude named first**.
- Error callback receives an `error` object with an `error.code` — see below.

## GeoJSON gotcha: longitude-first vs. the Geolocation API's latitude-first naming

The browser API gives you `position.coords.latitude` and `.longitude` (latitude mentioned
first in the property names), but this project's backend (`/user/location`, matching the
Mongoose schema's GeoJSON `location.coordinates`) expects **longitude first**:
```js
location: { coordinates: [longitude, latitude] }   // GeoJSON standard order
```
Easy to accidentally flip these — same category of bug as any "two values, easy to swap"
mistake, except this one wouldn't crash anything; it would just silently save a location on
the wrong side of the planet (or in the ocean, if the swap produces out-of-range values).
Always deliberately build the array as `[position.coords.longitude, position.coords.latitude]`
— don't just destructure in the order the API happens to name them.

## `error.code` — distinguishing a real denial from a retryable failure

```js
(error) => {
    // error.code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
}
```

These are standardized constants from the Geolocation API spec, not something the app chooses.
The distinction matters a lot for what the UI should do next:

- **`1` (`PERMISSION_DENIED`)** — the user explicitly clicked "Block" on the permission prompt
  (or already had it blocked from a previous visit). **Crucially: calling
  `getCurrentPosition()` again will NOT show the permission popup again** — browsers only show
  that prompt once per site until the USER manually changes it via the browser's own site
  settings (the padlock/site-info icon near the address bar). No website's JavaScript can
  re-trigger that UI. So a "Try Again" button here would just silently fail again with zero
  feedback — worse than not offering one. Show guidance pointing to browser settings instead.
- **`2`/`3` (`POSITION_UNAVAILABLE`/`TIMEOUT`)** — a transient failure (GPS signal issue, the
  request took too long) — no permanent decision was made. A "Try Again" button calling
  `getCurrentPosition()` again genuinely has a chance of succeeding here, unlike the denial
  case.

**Built in `Body.jsx`** by storing the actual `error.code` (not just a plain boolean) in state,
and branching the banner UI on `code === 1` vs. `code !== null && code !== 1` — two different
messages/button sets for two genuinely different situations, instead of one generic "location
blocked" banner that can't tell them apart.
