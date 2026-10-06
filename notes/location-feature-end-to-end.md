# Location Feature — End to End (Frontend + Backend)

Built 2026-10-04 to 2026-10-06. This is the full picture of how a user's location gets set,
shown, changed, and kept — written after two days of working through it, so it covers the
exact points that were confusing, with real values traced through every step.

Files involved:
- Frontend: `src/components/Body.jsx`, `src/components/ProfilePreferences.jsx`, `src/utils/locationUtils.js`
- Backend: `src/routes/userRouter.js` (`/user/location`, `/location/search`, `/location/reverse`),
  `src/models/users.js`, `src/utils/validation.js`

---

## 1. The big picture

The feed filters people by distance (`maxDistance`). To measure "20 km from you", the backend
needs **your coordinates** saved on your user document (`location.coordinates`). Everything here
is just three ways of getting those coordinates saved, plus showing them in a human way.

```
Feature 1: Auto     → browser GPS gives coordinates → convert to a name → save both
Feature 2: Manual   → user types a place name → convert to coordinates → save both
Feature 3: Sticky   → remember if the user chose manually, so Feature 1 doesn't overwrite it
```

Two directions of "geocoding", both done by Nominatim (free OpenStreetMap service):

| Direction | Input | Output | Our route | Used by |
|---|---|---|---|---|
| Search (forward) | text: "Nehru Place" | list of places with lat/lon | `/location/search` | manual search box |
| Reverse | lat/lon numbers | one place name | `/location/reverse` | auto GPS + 📍 button |

Why "reverse" exists at all: the browser's GPS only gives **numbers**. It has no idea what
"Panchkula" is. Without reverse geocoding, the only thing we could show is
`Current: 30.72, 76.85`.

---

## 2. Backend pieces (and why each one exists)

### 2a. Schema fields — `models/users.js`
```js
location: { type: { type: String, enum: ["Point"] }, coordinates: { type: [Number], validate... } },
maxDistance: { type: Number },
locationLabel: { type: String },                       // NEW: readable name, e.g. "Panchkula, Haryana"
locationAutoSync: { type: Boolean, default: true }     // NEW: true = GPS may auto-update, false = sticky manual pick
```
- `locationLabel` exists because the UI needs a name and coordinates can't be read as one.
  Saving it once avoids re-asking Nominatim on every page load.
- `locationAutoSync` exists purely for the sticky feature. `default: true` means new users (and
  old users who never had the field) get automatic location with no migration needed.

### 2b. Whitelist — `utils/validation.js`
```js
const Allowed_Edits = ["location", "locationLabel", "locationAutoSync"];
const isEditAllowed = Object.keys(req.body).every((key) => Allowed_Edits.includes(key));
if (!isEditAllowed) throw new Error("Invalid request");
```
A security guard: `/user/location` may only touch location fields. Originally it only allowed
`"location"`. As soon as the frontend started sending `locationLabel`/`locationAutoSync`, the
request would have been rejected unless this list grew.

### 2c. `PATCH /user/location` — saves location fields (code did NOT change)
```js
const loggedInUser = req.user;                 // full Mongoose doc, from userAuth middleware
validateLocation(req);                          // whitelist + coordinates must be an array of 2
Object.keys(req.body).forEach((key) => {
    loggedInUser[key] = req.body[key];          // copies whatever allowed fields arrived
});
loggedInUser.location.type = "Point";           // GeoJSON needs this; client never sends it
await loggedInUser.save();
res.status(200).json({ data: loggedInUser, message: "User location set succesfully" });
```
The loop copies whatever keys pass the whitelist, so once the whitelist grew, the new fields got
saved with zero changes to the route itself.

Works the same whether the user had a location before or not: `loggedInUser.location = {...}`
creates it the first time, overwrites it later.

### 2d. `GET /location/search?q=...` — text → list of places
```js
const query = req.query.q;                                      // GET → data is in the URL, not a body
if (!query || query.trim().length === 0) throw new Error("Search query is required");
const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
const nominatimResponse = await fetch(nominatimUrl, { headers: { "User-Agent": `DevTinder-learning-project (contact: ${process.env.NOMINATIM_CONTACT_EMAIL})` } });
const results = await nominatimResponse.json();                 // fetch needs this extra step; axios does it for you
const places = results.map((place) => ({ display_name: place.display_name, lat: place.lat, lon: place.lon }));
res.status(200).json({ data: places, message: "Location search successFully" });
```

**Real output for `q=Nehru Place`** (captured 2026-10-06):

One raw Nominatim item has 14 fields:
```json
{ "place_id": 243010361, "licence": "...", "osm_type": "relation", "osm_id": 3709872,
  "lat": "28.5492574", "lon": "77.2529526", "class": "boundary", "type": "administrative",
  "place_rank": 20, "importance": 0.32, "addresstype": "suburb", "name": "Nehru Place",
  "display_name": "Nehru Place, South, Delhi, South Delhi, Delhi, India",
  "boundingbox": ["28.5462890", "28.5522538", "77.2483011", "77.2585045"] }
```
What our route sends back after `.map()`:
```json
{ "data": [
    { "display_name": "Nehru Place, South, Delhi, South Delhi, Delhi, India", "lat": "28.5492574", "lon": "77.2529526" },
    { "display_name": "Nehru Place, Nehru Place Road, Nehru Place, South, Delhi, South Delhi, Delhi, 110019, India", "lat": "28.5514171", "lon": "77.2517386" },
    { "display_name": "Nehru Place, Cashmere, Christchurch, ..., New Zealand / Aotearoa", "lat": "-43.5735381", "lon": "172.6200779" },
    { "display_name": "Nehru Place, Bombay Heights, ..., South Africa", "lat": "-29.5449118", "lon": "30.3955804" }
  ],
  "message": "Location search successFully" }
```
Things this real output shows:
- 4 results, not 5 — `limit=5` is a maximum, not a promise.
- `lat`/`lon` are **strings** → the frontend must `Number(...)` them before saving.
- Results from other countries appear because nothing restricts it. `countrycodes=in` would.

### 2e. `GET /location/reverse?lat=...&lon=...` — numbers → one name
```js
const lat = req.query.lat;          // always a STRING from the URL, e.g. "30.723458"
const lon = req.query.lon;
if (!lat || !lon) throw new Error("lat and lon are required");
const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=jsonv2`;
const nominatimResponse = await fetch(nominatimUrl, { headers: { "User-Agent": `...` } });
const result = await nominatimResponse.json();
res.status(200).json({ data: { display_name: result.display_name }, message: "Reverse geocode successFully" });
```

**Real output for `lat=30.723458&lon=76.852173`** (Panchkula):

Raw Nominatim — ONE object, not an array:
```json
{ "place_id": 244901454, "osm_type": "way", "lat": "30.7235030", "lon": "76.8522398",
  "category": "highway", "type": "residential", "addresstype": "road", "name": "",
  "display_name": "Panchkula, Haryana, 134114, India",
  "address": { "city": "Panchkula", "county": "Panchkula", "state": "Haryana",
               "postcode": "134114", "country": "India", "country_code": "in" },
  "boundingbox": [...] }
```
What our route sends back:
```json
{ "data": { "display_name": "Panchkula, Haryana, 134114, India" }, "message": "Reverse geocode successFully" }
```
After `shortenPlaceName` on the frontend → saved label: `"Panchkula, Haryana"`.

Known weakness: `display_name` starts with whatever is nearest the point. A few km away
(`30.6942, 76.8606`) it started with a restaurant → label became
`"DastarKhan, Major Sandeep Sankhla Chowk"`. Building the label from `address.city` +
`address.state` would be consistent. Not changed yet.

### 2f. Why the backend calls Nominatim, not the frontend (the proxy)
- Nominatim requires a `User-Agent` header identifying the app. **Browsers block JavaScript from
  setting `User-Agent`.** Node can.
- The frontend only ever talks to `localhost:7777`. It never needs to know Nominatim exists.
- The contact email lives in `.env` (`NOMINATIM_CONTACT_EMAIL`), not in code. It identifies the
  app's developer, the same for every request — it is NOT the logged-in user's email.

---

## 3. Feature 1 — Auto location on visit (`Body.jsx`)

### Flow
```
Page loads → init()
  → await fetchUser()                         (profile from /profile/view → Redux)
  → locationAutoSync !== false ?  yes →
  → getCurrentPosition()                      (browser shows "Allow location?" popup)
  → user clicks Allow → browser gets GPS → calls success function with position
  → GET /location/reverse                     ("what place is this?")
  → PATCH /user/location                      (save coordinates + label)
  → dispatch(addUser(...))                    (Redux updated → UI shows the name)
```

### The entry point
```js
useEffect(() => {
    const init = async () => {
        const fetchedUser = await fetchUser();
        if (fetchedUser?.locationAutoSync !== false) {
            fetchAndUpdateLocation();
        }
    };
    init();
}, []);
```
- `fetchUser` returns `response.data.data` (the user) so `init` can read the flag.
- These used to be two separate effects running in parallel with no order. We must **know the
  flag before deciding to run GPS**, so `fetchUser` is awaited first.
- `!== false` (not `=== true`): old documents may not have the field at all (`undefined`).
  `undefined !== false` is `true` → GPS runs. Only an explicit `false` turns it off.
- `Body` wraps every page and mounts once per full page load. Clicking between Feed /
  Connections / Requests does NOT remount it, so this runs once per visit, not per click.

### How the popup and `position` actually work (was confusing)
`position` does NOT exist when `getCurrentPosition` is called. The order is:
```
1. getCurrentPosition(successFn, errorFn) is called
     → browser shows the popup
     → the call RETURNS IMMEDIATELY; successFn has not run
2. ...browser waits for the user, however long it takes...
3. User clicks Allow
4. Browser works out the location (GPS / Wi-Fi / network)
5. Browser BUILDS the position object: { coords: { latitude: 30.72, longitude: 76.85, ... } }
6. Browser CALLS successFn(position) ← only now does our code inside run
```
`position` is just a parameter name, like `e` in `onChange={(e) => ...}`. You never create it.
Like leaving two phone numbers: "call this one if it works, this one if it fails."

| User action | What happens |
|---|---|
| Clicks Allow | `successFn(position)` runs |
| Clicks Block | `errorFn(error)` with `error.code = 1`. `position` never exists |
| Ignores popup | Nothing is called; browser keeps waiting (no `timeout` option set) |
| 2nd visit, already allowed | No popup, straight to step 4 |
| 2nd visit, already blocked | No popup, `errorFn` with code 1 immediately |

`getCurrentPosition` is callback-style, not a Promise — that's why it isn't `await`ed.

### `fetchAndUpdateLocation`, traced with real values
```js
navigator.geolocation.getCurrentPosition(
    async (position) => {
        try {
            const longitude = position.coords.longitude;    // 76.852173
            const latitude  = position.coords.latitude;     // 30.723458

            const reverseResponse = await axios.get(
                `http://localhost:7777/location/reverse?lat=${latitude}&lon=${longitude}`, { withCredentials: true });
            // reverseResponse.data.data.display_name = "Panchkula, Haryana, 134114, India"

            const locationResponse = await axios.patch('http://localhost:7777/user/location', {
                location: { coordinates: [longitude, latitude] },   // [76.852173, 30.723458]
                locationLabel: shortenPlaceName(reverseResponse.data.data.display_name)  // "Panchkula, Haryana"
            }, { withCredentials: true });

            dispatch(addUser(locationResponse.data.data));
            setLocationErrorCode(null);
        } catch (err) { console.log(err.message); }
    },
    (error) => { console.log(error.message); setLocationErrorCode(error.code); }
);
```
- `.data.data`: first `.data` is axios's HTTP body, second is our backend's `{ data, message }`.
- `[longitude, latitude]`: GeoJSON requires longitude first. The browser names them the other
  way. If flipped, nothing crashes — distances are silently measured from the wrong place.
- `locationAutoSync` is not sent: this path only runs when it's already `true`.
- `dispatch(addUser(...))`: saving to the DB doesn't update Redux. Without this line the DB had
  "Panchkula" but the screen showed nothing — this was a real bug we hit and fixed.
- `setLocationErrorCode(null)`: clears any old error banner after a successful retry.
- Two error paths: the `catch` = our backend calls failed; the second function = the browser
  couldn't get a location at all.

### Error banners
`error.code` is stored instead of a plain `true/false`, because:
- `1` = PERMISSION_DENIED. The browser will never show the popup again; only the user can fix it
  in site settings. → message only, **no** Try Again button (it would silently fail).
- `2`/`3` = position unavailable / timeout. Retrying can work. → **Try Again** button.

---

## 4. Feature 2 — Manual change in Profile Preferences (`ProfilePreferences.jsx`)

### Flow
```
User types "Chandigarh Sector 15"
  → handleSearchTextChange on every key (state + ref)
  → effect waits until typing stops for 1 second (debounce)
  → GET /location/search
  → reply checked against the live ref (stale-reply guard)
  → dropdown of results
  → user clicks one → handleSelectPlace → STAGED, nothing saved
  → user clicks Save Preferences → PATCH /profile/preferences, then PATCH /user/location
```

### State
```js
const [searchText, setSearchText]             = useState('');    // what's in the search box
const [places, setPlaces]                     = useState([]);    // dropdown results
const [selectedLocation, setSelectedLocation] = useState(null);  // staged pick, not saved yet
const latestQueryRef = useRef('');                               // live copy of the box
```

### Typing
```js
const handleSearchTextChange = (e) => {
    const value = e.target.value;
    setSearchText(value);            // updates the box + triggers the debounce effect
    latestQueryRef.current = value;  // updates the live copy immediately
}
```

### The debounce effect
```js
useEffect(() => {
    if (searchText.trim().length === 0) { setPlaces([]); return; }

    const timer = setTimeout(async () => {
        const response = await axios.get(
            `http://localhost:7777/location/search?q=${encodeURIComponent(searchText)}`, { withCredentials: true });
        if (searchText === latestQueryRef.current) {
            setPlaces(response.data.data);
        }
    }, 1000);

    return () => clearTimeout(timer);
}, [searchText]);
```
Typing "Chan" quickly:
```
"C"    → timer 1 scheduled
"Ch"   → cleanup cancels timer 1, timer 2 scheduled
"Cha"  → cancel 2, schedule 3
"Chan" → cancel 3, schedule 4
stop   → 1 second passes → only timer 4 fires → ONE request
```
Why **1000 ms** and not 300 ms: Nominatim allows ~1 request/second. With 300 ms, two requests
can still fire ~301 ms apart (type, pause, type, pause). With 1000 ms, two requests can never be
closer than a second — the delay itself enforces the limit.

### The stale-reply guard — "photo vs whiteboard" (was the most confusing part)
Question that came up: *we set `searchText` and `latestQueryRef.current` to the same value, so
how can `searchText === latestQueryRef.current` ever be false?*

Answer: **the `searchText` inside the timer is not the current state. It's a frozen copy.**

- Each effect run creates a new timer, and that timer remembers `searchText` **from the render
  it was created in** — a **photo**. It never changes afterwards.
- `latestQueryRef.current` is a **whiteboard on the wall**. `useRef` returns the same object on
  every render, so every old timer looks at the same whiteboard.
- **The timer never writes to the whiteboard.** Only `handleSearchTextChange` writes to it, on
  every keystroke — including keystrokes that happen *after* a request was already sent.

In the normal case (type, stop, wait for reply) photo = whiteboard → results shown. The check is
insurance for this case — **typing again while a request is still on its way**:

| Time | What happens | Timer's photo | Whiteboard |
|---|---|---|---|
| 0.0s | Type "nehru", stop | — | "nehru" |
| 1.0s | Timer A fires → request A sent | A = "nehru" | "nehru" |
| 1.2s | Nominatim is slow; you type " place" → `handleSearchTextChange` writes | | **"nehru place"** |
| 1.2s | Effect re-runs; `clearTimeout(A)` does nothing — A already fired; timer B scheduled | B = "nehru place" | "nehru place" |
| 1.5s | Reply A arrives → `"nehru" === "nehru place"` → **false → ignored** | | |
| 2.6s | Reply B arrives → `"nehru place" === "nehru place"` → shown ✅ | | |

Worse case: replies arrive in the wrong order (B first, then A). Without the check, A's old
results would overwrite B's correct ones.

Why `clearTimeout` alone isn't enough: it only cancels timers that haven't fired. Once a timer
fires, the request is already on the network.

Plain JS demo of why one is stale and the other is fresh:
```js
const ref   = { current: "nehru" };
const photo = "nehru";
const timerA = () => console.log(photo, ref.current);
ref.current = "nehru place";   // user typed more
timerA();                       // "nehru"  "nehru place"
```
`photo` is a plain value — copied when the function was made. `ref` is an object — the function
holds a pointer to it, so it sees later changes to `.current`.

### Clicking a result
```js
const handleSelectPlace = (place) => {
    setSelectedLocation({ ...place, autoSync: false });  // copy + tag as a manual pick
    setSearchText(place.display_name);                    // box shows the chosen name
    setPlaces([]);                                        // close the dropdown
}
```
Example result: `{ display_name: "Sector 15, Chandigarh, 160015, India", lat: "30.7415", lon: "76.7636", autoSync: false }`.
**No network call** — it's staged until Save. (We chose one Save button instead of a separate
Save Location button.)

### "📍 Use My Current Location"
Same GPS + `/location/reverse` flow as `Body.jsx`, but it **stages** instead of saving, and tags
it `autoSync: true`:
```js
setSelectedLocation({ display_name: displayName, lat: latitude, lon: longitude, autoSync: true });
```

### Save Preferences — one button, two requests
```js
// Request 1 — always
const response = await axios.patch('http://localhost:7777/profile/preferences', {
    genderPreference, minAge: Number(minAge), maxAge: Number(maxAge), maxDistance: Number(maxDistance)
}, { withCredentials: true });
dispatch(addUser(response.data.data));

// Request 2 — only if a location is staged
if (selectedLocation) {
    const locationResponse = await axios.patch('http://localhost:7777/user/location', {
        location: { coordinates: [Number(selectedLocation.lon), Number(selectedLocation.lat)] },
        locationLabel: shortenPlaceName(selectedLocation.display_name),
        locationAutoSync: selectedLocation.autoSync
    }, { withCredentials: true });
    dispatch(addUser(locationResponse.data.data));
    setSelectedLocation(null);
}
```
Real body for the Chandigarh pick:
```json
{ "location": { "coordinates": [76.7636, 30.7415] }, "locationLabel": "Sector 15, Chandigarh", "locationAutoSync": false }
```
- Two requests because each route's whitelist rejects the other's fields.
- `Number(...)`: Nominatim's lat/lon are strings.
- `setSelectedLocation(null)`: a later Save won't resend the same location.

### What `locationAutoSync: selectedLocation.autoSync` means
- Left side `locationAutoSync` = the field name the backend/schema expects.
- Right side `selectedLocation.autoSync` = our own tag, set when the location was staged.

| How you picked | Tag set | Sent |
|---|---|---|
| Search result (`handleSelectPlace`) | `autoSync: false` | `locationAutoSync: false` → sticky ON |
| 📍 button (`handleUseCurrentLocation`) | `autoSync: true` | `locationAutoSync: true` → auto GPS ON |

The tag travels with the choice, so the save code doesn't need an `if` to know how you picked.

### `shortenPlaceName` — `utils/locationUtils.js`
```js
export const shortenPlaceName = (displayName) =>
    displayName.split(",").slice(0, 2).join(",").trim();
```
`"Sector 15, Chandigarh, 160015, India"` → split → `["Sector 15", " Chandigarh", " 160015", " India"]`
→ slice(0,2) → `["Sector 15", " Chandigarh"]` → join → `"Sector 15, Chandigarh"`.
Shared file because `Body.jsx` and `ProfilePreferences.jsx` both need it.

### Showing the saved location
```jsx
{user?.locationLabel && <p>Current location: {user.locationLabel}</p>}
```
Reads from **Redux** (what's saved), not the staged pick. Hidden entirely if there's no label.

---

## 5. Feature 3 — Sticky manual location

### The problem
After picking Chandigarh manually, a page refresh re-ran Feature 1, got GPS (Panchkula), and
**silently overwrote the manual choice**.

### How it works now
```
Pick from search + Save   → locationAutoSync: false saved
Next page load            → init() reads false → false !== false is false → GPS skipped
📍 button + Save          → locationAutoSync: true saved
Next page load            → true !== false is true → GPS auto-update resumes
```

### Why a database flag
The choice must survive refresh, new tabs, other devices. Only the database survives all of
those; React state and Redux are wiped on refresh.

### Known limitation
If you're sticky on Chandigarh and physically move to Delhi, nothing changes until you press 📍.
Parked enhancement: detect "you've moved far" (Haversine distance between live GPS and saved
location, threshold ~30–50 km) and show a "Looks like you've moved — update?" banner instead of
silently overwriting.

---

## 6. Decisions at a glance

| Decision | Why | Why not the alternative |
|---|---|---|
| GPS logic in `Body.jsx` | Runs once per visit | In a page = reruns on every navigation |
| Reverse geocoding | GPS gives only numbers | Raw coordinates = bad UX |
| Backend proxy for Nominatim | Can set `User-Agent`; one API style | Browser can't set that header |
| `[lon, lat]` order | GeoJSON requires it | Flipped = silently wrong distances |
| Nominatim | Free, no key | Google needs billing + key; hardcoded list isn't real search |
| Debounce 1000 ms | Guarantees ≤ 1 request/second | 300 ms can still break the limit |
| `useRef` guard | Ignores out-of-order old replies | State inside a timer is a frozen photo |
| Stage, then one Save | One button UX | Separate button wasn't wanted |
| Two PATCH requests | Each route has its own whitelist | One request would be rejected |
| `locationLabel` field | Remember the readable name | Re-geocoding every load wastes calls |
| `locationAutoSync` flag | Survives refresh/tabs/devices | Redux/state is wiped on refresh |
| `!== false` check | Missing field counts as "auto" | `=== true` breaks old users |
| Merged `init()` effect | Know the flag before running GPS | Parallel effects = race |
| Store `error.code` | Denied vs. retryable need different UI | One boolean can't tell them apart |

---

## 7. Known issues (not fixed yet)

1. **Selecting a place fires one wasted search request.** `handleSelectPlace` and the 📍 button
   call `setSearchText(...)`, which re-triggers the debounce effect → another `/location/search`
   call a second later for the full chosen name. The dropdown doesn't reopen only by accident:
   those functions don't update `latestQueryRef`, so photo ≠ whiteboard and the reply is ignored.
   One Nominatim call is still wasted per selection.
2. **The success toast never shows.** `setShowToast(true)` is immediately followed by
   `navigate('/feed')`, which removes this component (and its toast) from the screen.
3. **Labels depend on what's nearest** (see 2e) — could use `address.city`/`address.state`.
4. **Search isn't limited to India** — `countrycodes=in` would fix it.
