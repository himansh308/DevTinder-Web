# Session Log — 2026-09-24: EditProfile Bugs, Login Race Condition, Image URLs

Chronological record of every bug/confusion hit while finishing the `EditProfile` page and
fixing a login-guard race condition surfaced by rapid browser-back navigation.

---

## 1. Blank page crash on refreshing `/profile/edit`

```jsx
const [firstName, setFirstName] = useState(user.firstName);   // ❌ user can be null here
```
On a hard refresh, Redux's `user` starts at `null` (its `initialState`). `Body.jsx`'s
`fetchUser()` is **async** and hasn't resolved yet by the time `EditProfile` first renders —
so `user` is still `null` at that instant. `user.firstName` on a `null` value throws a
`TypeError`, and with no error boundary in place, React just unmounts everything, leaving a
blank page.

**Fix — two parts:**
- Optional chaining on every `useState` initializer: `useState(user?.firstName)` (safe when
  `user` is `null` — evaluates to `undefined` instead of throwing).
- An early-return guard placed AFTER all hooks (Rules of Hooks — hooks must run unconditionally,
  every render, before any conditional `return`):
  ```jsx
  if (!user) {
      return <h1>Loading...</h1>;
  }
  ```

## 2. `useState`'s initial value only applies once — so the guarded fields stayed frozen at `undefined`

Fixing #1 surfaced a second, subtler bug: even after the fetch resolved and `user` became real,
the form fields stayed blank / showed "undefined undefined" in the preview.

**Why:** a `useState(initialValue)` call only ever *uses* `initialValue` on that component
instance's very first render. On every render after that, React ignores whatever you pass in
again — state only changes through calling the setter (`setFirstName(...)`) directly. Since
`EditProfile` first rendered while `user` was still `null`, `firstName`/`lastName`/`age`/
`photoUrl` all got locked in as `undefined` on that first render — and no later change to
`user` ever re-initializes them on its own.

**Fix — sync manually with a `useEffect` that reacts to `user` changing:**
```jsx
useEffect(() => {
    if (user) {
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setAge(user.age);
        setPhotoUrl(user.photoUrl);
        setSkills(user.skills ? user.skills.join(", ") : "");
    }
}, [user]);
```
`useEffect(fn, [dependency])` re-runs `fn` whenever a value in the dependency array changes
between renders — not just once on mount. `[user]` means "re-run this the moment `user` becomes
a different object," which is exactly what happens once the fetch resolves.

**Two bugs hit while writing this fix itself:**
- `setAge(user.setAge)` — typo, confusing the setter function's own name with the actual field
  name; should have been `setAge(user.age)`. Set `age` to `undefined` every time.
- `useEffect(() => {...})` with **no second argument at all** (not even `[]`) — this re-runs
  after **every single render**, not just when `user` changes. Traced the consequence: typing
  one character into "First Name" triggers a re-render (state update) → the effect fires again
  → since `user` is still truthy, it immediately overwrites `firstName` back to `user.firstName`
  → **typing anything into the form got wiped out on every keystroke.** Needed `[user]` as the
  dependency array.

## 3. `UserCard`'s Interested/Ignore buttons showing up in the `EditProfile` preview

The live preview correctly reused `UserCard`, but the Ignore/Interested buttons (meant only for
the swipe feed) showed up on your own profile preview too, since `UserCard.jsx` rendered that
button block **unconditionally**, regardless of whether the caller passed handlers for them.
`Feed.jsx` passes real `onInterested`/`onIgnored`; `EditProfile.jsx` passes neither, so
`onClick={onInterested}` silently became `onClick={undefined}` — the buttons still rendered,
just did nothing when clicked.

**Fix — only render the block when at least one handler is actually provided:**
```jsx
{(onInterested || onIgnored) && (
    <div className="card-actions justify-center mt-4 gap-4">
        <button className="btn btn-outline" onClick={onIgnored}>Ignore</button>
        <button className="btn btn-primary" onClick={onInterested}>Interested</button>
    </div>
)}
```

## 4. Browser back-button lands on `/login` while still logged in, sidebar still shows

**Root cause part one — why the sidebar shows on `/login` at all:** browser back/forward in a
React Router SPA doesn't do a hard page reload — it just changes the matched route. `Body.jsx`
(which owns the `Navbar`) never remounts, so Redux's `user` state is still sitting in memory
from the earlier login. `Navbar.jsx`'s `useSelector((store) => store.user)` still returns the
real user, which is exactly why the profile/logout dropdown still shows — nothing had ever
cleared it. It's not "the sidebar is broken," it's "you're still logged in, and you just
navigated back to a URL that happens to render the login form."

**Root cause part two — the actual bug:** `Login.jsx` had no awareness of whether someone was
already authenticated. Compare to the *opposite* case already built: `Body.jsx`'s route
protection stops a **logged-out** user from reaching `/feed`. The missing piece was the
mirror-image guard — stopping an **already-logged-in** user from reaching `/login` (or
`/signup`) at all.

## 5. The mirror-image guard's first version had its own race condition

First attempt:
```jsx
useEffect(() => {
    if (user) {
        navigate('/feed');
    }
}, [user]);
```
This worked for slow, single back-presses, but failed intermittently on **rapid double-back**
(pressing back twice within a fraction of a second). Root cause: `useEffect` always runs
**after** the render/commit — so there's a real window where React has already painted the
login form on screen, and only *then* does the effect fire and redirect away. That window is
normally too small to notice, but stacking multiple rapid `popstate` events (from mashing back)
made it possible to actually see the login form stick, since the effect-based redirect could
lose the race.

**Fix — decide during render instead of reacting after it, using the declarative `<Navigate>`
component instead of the imperative `useNavigate()` hook:**
```jsx
import { Navigate } from "react-router-dom";
// ...
if (user) {
    return <Navigate to="/feed" />;
}
// ...then the normal `return (<div>...login form...</div>)` below
```
This closes the race entirely — the redirect decision is now part of the same render pass that
would otherwise produce the login form, so the form can never actually get painted to the
screen for an already-logged-in user, no matter how fast the back button gets mashed.
**Consequence, not a bug:** `handleClick`'s own `navigate('/feed')` (called after a successful
login) became redundant once this guard existed, since `dispatch(addUser(...))` already makes
`user` truthy, which the `<Navigate>` guard picks up on the very next render anyway — removed.

## 6. Two things that LOOKED like bugs but weren't

- **Duplicate `view`/`feed`/`login` calls in the Network tab** — `main.jsx` wraps the app in
  `<StrictMode>`, which deliberately double-invokes every `useEffect` in development (mount →
  simulate cleanup → mount again) specifically to catch effects that aren't safe to run twice.
  Since neither `fetchUser` nor `fetchFeed` does any cleanup, this just means every effect-driven
  API call fires twice in dev. This disappears entirely in a production build — nothing to fix.
- **No `/profile/view` call when clicking "Profile" from the feed, or on some back-presses** —
  expected. `Body.jsx`'s `useEffect(() => { fetchUser() }, [])` has an empty dependency array,
  so it only runs once, on `Body`'s first mount. Clicking "Profile" or navigating within the SPA
  only swaps the `<Outlet/>` content — `Body` itself never remounts, so there's no reason for it
  to refetch. If this showed up inconsistently, it was almost certainly because a genuine hard
  refresh got mixed into the testing, not the back button behaving differently.

## 7. Broken profile photo — a Wikipedia article page URL, not a direct image link

```
https://en.wikipedia.org/wiki/Elon_Musk#/media/File:Elon_Musk_-_54820081119_(cropped).jpg
```
Despite ending in `.jpg`, this is the URL of a Wikipedia **article/file-description page** — an
HTML page that happens to *display* the image among other things. `<img src={photoUrl}>` needs
a URL that responds with actual image bytes, not a webpage; requesting this URL returns HTML,
so the browser shows a broken-image icon instead. Same root category as the backend's default
`photoUrl` bug flagged earlier (a Google *search results* page instead of a direct image link).

**Fix:** right-click directly on the image itself (not the page) → "Copy Image Address" — gives
a URL like `https://thumb.wikimedia.org/wikipedia/commons/thumb/.../....jpg`, which points
straight at the image file and renders correctly.

## 8. UI polish on `UserCard`'s image (not a bug, a styling pass)

- `object-cover` alone defaults to center-cropping, which cut off the top of a tall portrait
  photo — added `object-top` to keep faces in frame.
- `h-72` → `h-80` for a better-proportioned image area against the `w-96` card width.
- Added `overflow-hidden rounded-2xl` to the **outer** card `div` (not just the inner
  `<figure>`) — without it, the image's square corners weren't reliably clipped to match the
  card's own rounded corners.

---

## Pattern across this session

Two bugs here (#2's `useEffect` with no dependency array, and #5's effect-based redirect) share
the same underlying lesson: **`useEffect` runs *after* render/commit, so anything time-sensitive
or render-blocking is better decided *during* render** (a plain conditional / `<Navigate>`) than
reacted to *after* the fact in an effect. Worth remembering as a design instinct: reach for an
effect for genuine side effects (fetching, subscriptions, syncing state to an external system);
reach for a plain conditional in the render body when the goal is "what should even be shown."
