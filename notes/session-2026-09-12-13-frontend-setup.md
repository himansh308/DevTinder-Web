# Session Log — 2026-09-12/13: Frontend Scaffold + First Login Flow

Chronological record of bugs hit while setting up the frontend and wiring the first working
Login flow. The bigger/conceptual ones (Tailwind version drift, CORS/cookies, React Router
Outlet pattern, Redux exports) have their own dedicated notes files — this log covers the
smaller mechanical mistakes made along the way, in the order they happened.

---

## 1. `useState` destructured as an object instead of an array

**What was written:**
```js
const {emailId , setEmailId} = useState("");
```
**Why it's wrong:** `useState()` returns an **array** — `[currentValue, setterFunction]` — not
an object. Object-destructuring syntax looks for properties literally named `emailId`/
`setEmailId` on that array, which don't exist — both end up `undefined`.

**Fix:**
```js
const [emailId, setEmailId] = useState("");
```

## 2. Stray text sitting inside a JSX attribute — a parse error

**What was written:**
```jsx
<input placeholder="Please type your password here"Password className="..." />
```
Bare text (`Password`) sitting directly after a closing attribute-value quote, with nothing
wrapping it — JSX can't parse this at all inside a tag's attribute list. Leftover from adding a
separate `<label>` and forgetting to remove the old inline text. Deleting the stray text fixed
it.

## 3. `onClick={handleClick()}` — calling immediately instead of passing a reference

**What was written:**
```jsx
<button onClick={handleClick()}>Login</button>
```
The parentheses call `handleClick` **immediately, during render** — not when the button is
actually clicked. Since `handleClick` returned nothing, this set `onClick` to `undefined`,
meaning clicking the button did nothing at all.

**Fix:** pass the function itself, no parentheses: `onClick={handleClick}`.

## 4. `this.target.value` instead of `e.target.value`

**What was written:**
```jsx
onChange={(e) => this.target.value}
```
Two problems: arrow functions don't have their own `this` (a leftover pattern from
class-based React components or vanilla-JS handlers, not applicable in a functional
component) — and even fixed to `e.target.value`, the expression only *read* the value and threw
it away, never calling the setter.

**Fix:**
```jsx
onChange={(e) => setEmailId(e.target.value)}
```

## 5. DevTools Network tab showing nothing — not a code bug at all

**Symptom:** clicked Login, no request appeared in the Network tab at all.

**Cause:** a leftover filter string (`"backstage-backend"`, from an unrelated work context) was
still typed into the Network tab's filter box, hiding every request whose name didn't match it
— including the actual `localhost:7777/login` request, which had genuinely fired the whole
time. Clearing the filter box revealed it immediately. A pure DevTools-state issue, not
anything wrong with the code.

## 6. "Nothing shows in the console" — also not a bug, just an incomplete `console.log`

After fixing #5, the request turned out to have **succeeded** (200 OK) — but nothing printed,
because the `try` block only had error logging, never a success-path log:
```js
try {
    const resposne = await axios.post(...);
    // nothing here — no console.log on success
}
catch(err) {
    console.log(err);   // only this path logs anything
}
```
Added `console.log(resposne.data)` after the successful call to actually see the response.

## 7. `<route>` lowercase, and `<Route>`'s content passed as children instead of via `element`

**What was written:**
```jsx
<Routes>
  <route>
    <Body></Body>
  </route>
</Routes>
```
Two issues: `<route>` (lowercase) is treated as a literal HTML tag, not the imported `Route`
component — and `Route` wasn't even imported (only `Routes` was). Separately, `<Route>` takes
its target component via an `element` prop, not as JSX children:
```jsx
<Route path='/' element={<Body/>}>
  {/* nested routes as children of Route, not of Body */}
</Route>
```

## 8. Missing `/feed` route — `useNavigate('/feed')` silently went nowhere useful

After correctly wiring `useNavigate` (see `react-router-patterns.md` for the `Navigate` vs
`useNavigate` mix-up that came before this), calling `navigate('/feed')` had nowhere to actually
land, since no `<Route path='/feed'>` existed yet in `App.jsx` — the `Outlet` would've just
stayed blank. Fixed by creating a `Feed.jsx` placeholder and adding the matching nested route.

---

## The pattern across these

Several of these (#1, #3, #7) are the same category of mistake as ones already logged on the
**backend** side (missing `return`, calling instead of referencing, wrong destructuring shape)
— just showing up in React/Router-specific syntax instead of plain JS/Mongoose. Worth
recognizing "this is that same shape of mistake again" rather than debugging each from scratch.
#5/#6 are a good reminder that "nothing is happening" doesn't always mean the code is broken —
sometimes it's the tooling/observability around it (a stale filter, a missing log line) that's
hiding a success.
