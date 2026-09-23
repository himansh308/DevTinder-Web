# Session Log — 2026-09-22/23: Route Protection, Logout, Feed Rendering

Chronological record of every mistake/confusion hit while building Episode 17's route
protection, logout, and the feed-fetching + `UserCard` + single-card-at-a-time flow.

---

## 1. Is dispatching in both `Body.jsx` AND `Login.jsx` redundant? (conceptual, not a bug)

**The worry:** `Login.jsx` dispatches `addUser` on successful login; `Body.jsx` was about to
also dispatch `addUser` on mount (to survive page refreshes). Looked like the same thing done
twice.

**Resolution, traced through two full scenarios:**
- **Fresh session, no cookie:** `Body`'s mount-check runs and *fails* (no valid cookie) →
  redirects to `/login`. User submits the form → **only `Login`'s dispatch fires.**
- **Already logged in, page refresh:** `Body`'s mount-check runs and *succeeds* (cookie's
  still valid) → dispatches directly. User never touches the login form → **only `Body`'s
  dispatch fires.**

Key fact making this work: `Body` only mounts **once** per hard page load — navigating between
nested routes (`/login` → `/feed` via `<Outlet/>`) does NOT remount it. So the two dispatches
are mutually exclusive per real user journey, never both firing for the same event.

## 2. `/profile/view` still returning a plain string — an old bug resurfacing

```js
res.send("User : " + user);   // ❌ string concatenation, not JSON
```
This exact bug was flagged on this route back near the start of the whole project and never
actually got fixed when the route got renamed/rebuilt. Needed for real this time, since the
frontend now needs structured data back from it:
```js
res.status(200).json({ data: user, message: "User fetch Successfully" });
```

## 3-7. `Body.jsx`'s `fetchUser` — five bugs in the first draft

- **#3: Function defined but never called** — no `useEffect` at all; needed
  `useEffect(() => { fetchUser(); }, [])`.
- **#4: Wrong HTTP method** — `axios.get(...)` used against `/profile/view`, which is a `POST`
  route on the backend. Method mismatch → 404 every time.
- **#5: `response.data` vs `response.data.data`** — same "double `.data`" issue as `Login.jsx`
  earlier. `response.data` is the *whole* body (`{data: user, message}`), not the user object
  itself.
- **#6: `err.status` instead of `err.response?.status`** — for axios errors, the HTTP status
  code lives at `err.response.status`, not directly on `err.status`. As originally written, the
  401-check might never actually fire.
- **#7: `axios.post(url, {withCredentials:true})` — wrong argument position.** `axios.post`
  takes **three** arguments: `(url, data, config)`. Only two were given, so
  `{withCredentials:true}` was being sent as the request **body**, not as config — meaning
  `withCredentials` was never actually applied, and the cookie never got attached. Fix:
  `axios.post(url, {}, {withCredentials:true})` — empty body, config in the correct third slot.

## 8. `Navbar.jsx`: `<link>` instead of `<Link>` — same category as the `<input>` crash

```jsx
<link to="/" className="btn btn-ghost text-xl">DevTinder</link>   // ❌
```
`<link>` (lowercase) is a real HTML **void element**, reserved for `<head>` metadata — it
can't have children content at all, and isn't rendered as visible page content anyway. Needed
React Router's **`<Link>`** component (capitalized, imported from `react-router-dom`) —
completely different thing, meant for in-app navigation. Same *shape* of mistake as the
`<input>`-with-children crash from the Ep15 notes, just inverted: that time the lowercase
HTML tag was correct and children broke it; this time the lowercase tag was simply the wrong
*kind* of thing entirely.

## 9. `feedSlice.js`: `initialState: {}` considered, then corrected to `[]`

Since the feed is a **list** of people that gets `.map()`-ed over, the "nothing loaded yet"
state needs to be something `.map()` can safely run on — an empty **array**, not an empty
object. Same reasoning as the backend's `getConnectionIds` returning an empty `Set` (not a
string) for its "no connections" case — match the empty-state's type to what callers will
actually do with it.

## 10. `store.js`: naming an import `useReducer` — collides with a real React hook

```js
import useReducer from './userSlice';   // ⚠️ not a bug here, but a bad name
```
`useReducer` is also the name of a real, built-in React hook (`React.useReducer`, for local
component state). No functional collision occurred (the real hook wasn't also imported in this
file), but the name is genuinely misleading. Renamed to `userReducer`, matching the established
convention.

## 11. `UserCard.jsx`: props parameter not destructured

```jsx
function Usercard(user){   // ❌ `user` here is the WHOLE props object
```
A component's first parameter is always the entire props object. If called as
`<UserCard user={someObject} />`, the real data would be at `user.user` (confusingly
double-nested), not `user.firstName` directly. Fixed by destructuring in the parameter itself:
`function UserCard({ user }){`.

## 12. `UserCard.jsx`: four smaller bugs in the same file

- Unused `import { use } from "react"` — dead import, never used.
- `src={user.photoUrl }alt="..."` — missing space between the closing `}` and the next
  attribute.
- `<h2>{user.firstName} + {user.lastName}</h2>` — the `+` is literal JSX text, not addition; it
  rendered as an actual "+" character between the names (e.g. "Emma + Nair"), not intended.
- `<h2>{user.skills}</h2>` — `user.skills` is an **array**. Interpolating an array directly into
  JSX renders every element squished together with **no separator** (e.g.
  `"TypeScriptJavaScript"`), not a crash, just wrong-looking output. Fixed by rendering each
  skill as its own DaisyUI `badge` via `.map()`.

## 13-16. `Feed.jsx`'s `fetchFeed` — four more bugs, several repeats of earlier patterns

- **#13: `useDispatch()` called INSIDE `fetchFeed`, not at the component's top level.** This
  violates React's **Rules of Hooks** — hooks (`useDispatch`, `useSelector`, `useState`,
  `useEffect`, etc.) can only be called directly at a component's top level (or inside another
  custom hook) — never inside a nested regular function, callback, loop, or conditional. Fixed
  by moving `const dispatch = useDispatch();` to the top of `Feed`, same as everywhere else.
- **#14: Missing `await` on `axios.get(...)`** — gave back an unresolved Promise instead of the
  real response.
- **#15: Typo `'http://localhost7777/feed'`** — missing the `:` before the port. Without it,
  this isn't "port 7777 on localhost" at all — it's a totally different, nonexistent hostname.
- **#16: `fetchFeed` defined but never called** — same missing-`useEffect` pattern as `Body.jsx`
  originally, and as this same file's very first draft.

## 17. Rendering `feed` as a single object instead of `.map()`-ing over the array

```jsx
<UserCard key={feed._id} user={feed}></UserCard>   // ❌ feed is an ARRAY of people
```
`feed._id` is `undefined` (arrays don't have an `_id`), and `user={feed}` would pass the
*entire array* as one card's data. Needed `.map()` to iterate, rendering one card per item:
```jsx
{feed.map((user) => (<UserCard key={user._id} user={user} />))}
```

## 18. Missing `return` inside `.map()`'s callback — the same recurring bug, again

```jsx
feed.map((user)=>{
    <UserCard key={user._id} user={user}></UserCard>   // ❌ never returned
})
```
Without `return`, this implicitly returns `undefined` for every item, so nothing renders at
all. This exact *shape* of mistake (arrow function with `{}` block body, no explicit `return`)
has now shown up repeatedly across this whole project — `validateEditProfileDate`'s `.every()`
(backend), `Navbar.jsx`'s `useSelector`, and now here. Worth internalizing as a reflex check:
**any `{}`-bodied arrow function needs an explicit `return` if its value is used anywhere.**

## 19. `if`/`else` statement written directly inside JSX curly braces — invalid

```jsx
{
    if(feed[0] === undefined){
        return <h1>You have seen everyone</h1>
    }
    else{
        <UserCard key={feed[0]._id} user={feed[0]}></UserCard>
    }
}
```
JSX curly braces only accept **expressions** (things that evaluate to one value) — never
**statements** like `if`/`else`. Same underlying rule as an earlier backend bug: trying to put
an `if` statement inside a MongoDB query object literal (`User.find({ if(...){...} })`) failed
for the identical reason — object literals and JSX braces both expect a value, not
control-flow logic. `return` also doesn't make sense here, since this isn't inside a separate
function — it's directly inside the component's own `return(...)` JSX tree.

**Fix — use a ternary instead**, since a ternary IS an expression:
```jsx
{
    feed[0] === undefined ? (
        <h1>You have seen everyone</h1>
    ) : (
        <UserCard key={feed[0]._id} user={feed[0]} />
    )
}
```

## 20. `feedSlice.js`: new reducer defined but never exported

```js
export const{ addFeed, removeFeed} = feedSlice.actions;   // ❌ missing removeUserFromFeed
```
`removeUserFromFeed` was added to the `reducers` object, but forgotten from this destructuring
line — meaning nothing outside the file could actually import/dispatch it yet. Fixed by adding
it: `export const { addFeed, removeFeed, removeUserFromFeed } = feedSlice.actions;`.

## 21. Confusing `findOne()` (a database method) with a plain JS array method

**The question:** "how do I remove one specific person from the feed array, by ID?" **The
wrong instinct:** reach for `findOne()` — but that's a Mongoose/MongoDB method, for querying an
actual database. This reducer runs entirely in the browser, on a plain JS array already sitting
in Redux memory — no database involved at all.

**The right tool:** `.filter()` — already used extensively elsewhere in this project (both
backend and frontend). The condition needed is "keep everyone whose `_id` is NOT the one being
removed":
```js
removeUserFromFeed: (state, action) => {
    return state.filter((user) => user._id !== action.payload);
}
```
Traced with `state = [Emma, Frank, Isla]`, removing Emma: Emma's own `_id !== EmmaID` → `false`
→ excluded; Frank's/Isla's `_id !== EmmaID` → `true` → kept. Result: `[Frank, Isla]`.

## 22. Two JSX props accidentally merged into one malformed expression

```jsx
onInterested={()=>handleSendRequest("interested" , feed[0]._id) onIgnored ={()=> handleSendRequest("ignored" , feed[0]._id)}}
```
`onInterested`'s value never got closed with `}` before `onIgnored` started — the two separate
props got smashed together into one broken expression. Needed to be written as two clearly
separate, individually-closed props:
```jsx
onInterested={() => handleSendRequest("interested", feed[0]._id)}
onIgnored={() => handleSendRequest("ignored", feed[0]._id)}
```

## 23. The URL template-literal bug, twice over

```js
'http://localhost:7777/request/send/${status}/${toUserId}'
```
Two problems stacked:
- **Single quotes instead of backticks.** `${...}` interpolation syntax only has any effect
  inside backticks (`` ` ``). Inside single or double quotes, `${status}` is just decorative
  literal text — the actual string sent is always exactly `.../send/${status}/${toUserId}`,
  dollar-signs and all, never the real values. (Traced with real example values: with single
  quotes, `status="interested"` makes zero difference to the output string at all.)
- **Wrong variable name.** Even after switching to backticks, `${toUserId}` doesn't exist in
  this function's scope — the actual parameter is named `userId`
  (`handleSendRequest = async(status, userId) => {...}`). Needed `${userId}`.

Correct version: `` `http://localhost:7777/request/send/${status}/${userId}` ``.

## 24. Calling a handler immediately instead of passing a function reference — again

```jsx
onInterested={handleSendRequest("interested", feed[0]._id)}   // ❌
```
Same category of mistake as the original `onClick={handleClick()}` bug from `Login.jsx`, now
with arguments. This **calls `handleSendRequest` immediately, during render** — not on click.
Since it's `async`, calling it returns a Promise, so `onInterested` ends up set to *that
Promise*, not a callable function. Two consequences: clicking the button does nothing
afterward (it's not a function anymore), AND the API call fires unprompted on every single
render.

**Fix — wrap it in an arrow function**, which delays the actual call until the wrapper itself
gets invoked (i.e., on a real click):
```jsx
onInterested={() => handleSendRequest("interested", feed[0]._id)}
```
**The general rule:** any prop meant to run "later, in response to an event" needs a function
you *haven't called yet* — a bare reference (`onClick={handleClick}`) when no arguments are
needed, or a wrapper arrow function (`onClick={() => handleClick(arg)}`) when arguments are
needed — never the *result* of calling the function outright.

---

## Patterns across all 24

The single most repeated mistake this session: **missing `return` inside a `{}`-bodied arrow
function** (#18, plus the recurring pattern noted within it) — this has now shown up on both
the backend and frontend, in `.every()`, `.filter()`, `.map()`, and `useSelector` callbacks
alike. Second most common: **calling a function immediately instead of passing a reference**
(#24, and the original `Login.jsx` bug it echoes) — anywhere a prop expects "something to run
later," parentheses on the function call are almost always wrong. Worth treating both as
reflex checks whenever writing a callback.
