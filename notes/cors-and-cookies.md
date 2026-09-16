# CORS, `withCredentials`, and Cookie Scoping

## Backend CORS setup — required before the frontend can call it at all

```js
// backend: src/index.js
const cors = require('cors');
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
```

Placed **before** the routers, so CORS headers apply before any route logic runs. `origin` is
the exact frontend URL allowed to make cross-origin requests; `credentials: true` is what
allows the JWT cookie to actually flow — without it, even if `origin` is correctly set, cookies
never get sent/stored.

**Sequence that actually happened:** built the frontend's axios call first, hit a real CORS
error in the browser (expected — the backend didn't allow the frontend's origin yet), *then*
added this middleware to fix it. Seeing the actual browser-blocked error once is worth more than
being told about CORS in the abstract.

## `withCredentials` — the two things it actually controls

```js
const response = await axios.post('http://localhost:7777/login', {
    email: emailId,
    password: password
}, { withCredentials: true });
```

Without this option, by default the browser does **neither** of two things:
1. **Send** existing cookies along with a cross-origin request.
2. **Store** a new cookie that a cross-origin response tries to set via `Set-Cookie`.

Even if the server *sends back* `Set-Cookie` (which it always does — that's a server-side
decision, independent of the request), the browser is allowed to just **discard** it instead of
saving it, specifically because the request never opted in to accepting credentials.

**What DevTools shows vs. what actually got stored — these are different things.** The
Network tab's Headers panel shows the **raw response the server sent** — `Set-Cookie` appearing
there proves the server tried, not that the browser kept it. To check what's *actually* stored,
use **Application → Cookies → [origin]**, not the Network tab's per-request Headers/Cookies
view.

## The false-alarm: "it worked without `withCredentials`?!"

**What happened:** tested login without `withCredentials` at all. Application → Cookies showed
**nothing** (correct — matches the rule above). Added `withCredentials`, tested again, cookie
appeared correctly. Then, while double-checking by *removing* `withCredentials` again and
retesting with a different user (to "prove" it was really required) — the cookie **still
appeared**. This looked like it contradicted the whole `withCredentials` rule.

**The actual explanation:** it was a **stale cookie from the earlier successful test**, still
sitting in the browser, never cleared before the "disproof" test ran. Cookies persist until
expired or manually cleared — they don't vanish just because a *later* request stopped
requesting them properly. The "disproof" test wasn't actually clean.

**How to run a genuinely clean test:**
1. Manually delete the cookie in Application → Cookies first.
2. *Then* run the request you're testing.
3. Check Application → Cookies again — if it's empty, the request genuinely didn't cause a
   cookie to be stored (or vice versa, if it reappears, the request genuinely did).

Skipping step 1 is what caused the false alarm — always clear existing state before trusting a
"this proves X" test result.

## Side note: cookies are scoped by domain, NOT by port

Relevant background, even though it turned out not to be the actual explanation above: browser
**cookie storage** (a separate, older spec than CORS) scopes cookies by *domain + path only* —
port is not part of a cookie's scope at all. So a cookie set (without an explicit `Domain=`
attribute) by a response from `localhost:7777` is, from the cookie jar's perspective, associated
with the domain `localhost` — which technically overlaps with `localhost:5173` too, since
they share the same hostname. This is a genuinely different rule system than CORS's "origin"
concept (which *does* include port, making `localhost:7777` and `localhost:5173` different
origins for CORS purposes). Worth knowing this distinction exists, even though the specific
confusing test result above turned out to be a stale-cookie mistake, not this mechanism kicking
in.
