# Debounce vs. Throttle, and Sizing a Delay Against a Real Rate Limit

Design discussion ahead of building the location search-as-you-type feature
(`ProfilePreferences.jsx`, calling the backend's `/location/search` → Nominatim proxy). Not yet
implemented as of this note — captured here because the reasoning matters more than the code
and shouldn't need re-deriving later.

## Debounce vs. throttle — picking the right one for search-as-you-type

- **Debounce**: wait for the user to PAUSE for some interval before firing anything. Every new
  keystroke RESETS the timer. Typing "nehru" quickly fires ZERO requests until the user
  actually stops — then exactly one fires, for whatever's currently typed.
- **Throttle**: fire at most once every X ms, regardless of pauses — doesn't care if the user
  is still actively typing, just rate-limits how often something CAN fire.

For search-as-you-type, you don't want a request for every intermediate half-typed state ("n",
"ne", "neh"...) — you want ONE request for what the user actually meant. That's debounce's job,
not throttle's.

## This isn't just UX polish — Nominatim's ~1 request/second limit makes it a hard requirement

Without debouncing, typing "Nehru Place" naturally fires 11 requests (one per keystroke) in
under a second — guaranteed to hit the rate limit almost immediately during normal typing.

## The debounce delay itself must be ≥ the rate-limit interval — a subtle timing trap

A debounce delay of, say, 400ms does NOT automatically guarantee two resulting requests stay a
full second apart from EACH OTHER — it only guarantees each individual request waited for ITS
OWN 400ms of silence.

**Concrete failure case with a 400ms debounce:**
1. Type "nehru", pause exactly 400ms → request A fires.
2. Resume typing almost immediately (say, 1ms later), type " place", pause another 400ms →
   request B fires.
3. Gap between A and B: only ~401ms — **violates** the "1 request/second" rule, even though
   each pause individually honored the 400ms debounce window correctly.

**The fix: set the debounce delay to ≥ 1000ms, not the more typical ~300ms** you'd see on
something like Google's own address autocomplete (which can afford that because their own
infrastructure handles far higher request volume). Reasoning for why ≥1000ms is sufficient,
not just "probably fine": for request B to EVER fire, the user must type something new, and
that keystroke can only happen AFTER request A already fired (typing cancels/resets the
pending timer — see the general debounce mechanism below). So if the debounce window is
1000ms, B can't fire until 1000ms after whatever keystroke follows A — meaning the MINIMUM
possible gap between A and B becomes 1000ms, by construction of the debounce logic itself. No
separate rate-limiter needed for this specific concern (single-user, single-browser-tab) —
picking delay ≥ limit-interval enforces it directly, mathematically, every time.

**Tradeoff**: feels slightly less "instant" than a ~300ms debounce would — but 1000ms is still
a completely normal, responsive feel for a type-ahead field; it does not feel like "waiting."

## The debounce mechanism itself, concretely — `useEffect` + `setTimeout` + cleanup

```jsx
useEffect(() => {
    const timer = setTimeout(() => {
        // fire the actual search request here
    }, 1000);

    return () => clearTimeout(timer);   // cleanup
}, [searchText]);
```

Traced through typing "nehru" fast:
1. Type `"n"` → `searchText` becomes `"n"` → effect runs → schedules a timer for 1000ms later.
2. Type `"e"` 100ms later → `searchText` becomes `"ne"` → React is about to re-run the effect,
   so it FIRST calls the previous run's cleanup → `clearTimeout` cancels the `"n"` timer before
   it ever fires → THEN schedules a fresh timer for `"ne"`.
3. This repeats for every keystroke — each new letter cancels the previous pending timer and
   starts a new one.
4. Typing stops after "nehru" → no new keystroke arrives within 1000ms → the timer finally
   survives long enough to actually fire → that's the one and only request sent.

Not "wait, then send once" — "keep cancelling and rescheduling until nothing interrupts for
the full delay."

## A separate problem debounce does NOT solve: stale responses arriving out of order

Even with debouncing in place, there's roughly ONE in-flight request at a time, but network
timing is never guaranteed in order. If you type "nehru" (fires request A), then quickly add
" place" (fires request B) before A's response arrives, there's a real chance B's response
comes back BEFORE A's — and without a guard, A's now-stale results could overwrite B's correct
ones a moment after they render.

**The guard: a `useRef` holding the always-latest typed value, compared against what each
response was originally searched for before trusting it.**

`useState` gives a value that triggers re-renders, but any function closing over it (like a
debounced callback) captures a SNAPSHOT from when that function was created — it doesn't see
later updates. `useRef` gives a mutable box (`.current`) that does NOT trigger re-renders when
changed, but ALWAYS reflects the latest value, no matter how old the closure reading it is.
That "always fresh regardless of closure age" property is exactly what's needed here.

**Worked dry run:**
1. Type "nehru" → pause → request A fires for `"nehru"`. At that moment,
   `latestQueryRef.current = "nehru"` too (updated synchronously in the input's own `onChange`,
   NOT waiting for the debounce).
2. Before A resolves, type " place" → `searchText` AND `latestQueryRef.current` immediately
   become `"nehru place"` → a new debounce timer starts for the new text.
3. Suppose (pure network timing) the `"nehru place"` request resolves FIRST:
   - Compare `"nehru place"` (what IT searched for) against `latestQueryRef.current`
     (`"nehru place"`) → MATCH → update the results shown. Correct.
4. The stale `"nehru"` response arrives later:
   - Compare `"nehru"` against `latestQueryRef.current` (still `"nehru place"`) → MISMATCH →
     discard this response entirely, do nothing.
5. Result: the screen only ever shows results matching the CURRENT input, regardless of which
   network request happened to finish first.

## Scope note: this only guards one browser tab's own requests

This debounce+ref combo protects against ONE user's own typing spamming requests. If this app
ever had multiple real users searching locations simultaneously, a single backend process
could still exceed Nominatim's GLOBAL rate limit across DIFFERENT people's requests, even if
each person's frontend is perfectly debounced. Solving THAT would need a server-side rate
limiter (the backend itself tracking "when did I last call Nominatim" and delaying/queueing if
too soon) — not needed for a personal learning project with one real user at a time, but worth
remembering if this ever became a multi-user concern.
