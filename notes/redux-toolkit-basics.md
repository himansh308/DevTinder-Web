# Redux Toolkit Basics

## `createSlice` — a self-contained chunk of state + the logic to update it

```js
import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",              // internal label Redux Toolkit uses for this slice
  initialState: null,        // the value BEFORE anyone logs in — "nobody logged in yet"
  reducers: {
    addUser: (state, action) => {
      return action.payload;    // action.payload = whatever data was passed when dispatching
    },
    removeUser: () => {
      return null;               // resets back to "nobody logged in"
    }
  }
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
```

- `state` — the slice's *current* value, right before this particular reducer function runs.
- `action` — the thing that triggered this update; `action.payload` is whatever data got
  attached when the action was dispatched (see below).
- `userSlice.actions` — auto-generated functions (`addUser`, `removeUser`) you call later to
  *trigger* these reducers from anywhere in the app.
- `userSlice.reducer` — the actual state-updating logic function itself, which `configureStore`
  needs.

## Default export vs. named export — why `userSlice.reducer` becomes `userReducer` with no code connecting the names

**The confusing part:** `userSlice.js` exports as `export default userSlice.reducer;`, but
`store.js` imports it as `import userReducer from "./userSlice";` — two completely different
names, no obvious link between them.

**The resolution:** a **default export has no name attached to it at all.** `export default X`
just says "this file's *one* default export **is** this value" — full stop. Whoever imports it
gets to choose **any local name they want**:
```js
import userReducer from "./userSlice";     // could just as easily be:
import bananaFunction from "./userSlice";  // — identical value, different chosen label
```
The actual function being imported is the exact same thing either way; only the label attached
to it in the *importing* file changes.

**Contrast with named exports** (`addUser`/`removeUser` in the same file):
```js
export const { addUser, removeUser } = userSlice.actions;
```
These **do** have specific names attached, so importing them normally requires matching those
exact names:
```js
import { addUser, removeUser } from "./userSlice";
```
(You *can* rename these too, with `as` — `import { addUser as login } from "./userSlice"` —
but by default, named exports expect the same name unless explicitly renamed.)

## `configureStore` — how the `reducer` key shapes the actual global state tree

```js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";

const store = configureStore({
  reducer: {
    user: userReducer
  }
});

export default store;
```

- **`configureStore({...})`** — builds and returns the actual store object. Takes one config
  object.
- **The `reducer` key** — this exact key name is required by `configureStore`'s own API; it's
  not something you choose.
- **The value of `reducer`** — an object *you* build, mapping **names you choose** (`user`) to
  **reducer functions** (`userReducer`, imported from the slice file). A second slice would add
  another line: `posts: postsReducer`.
- **What this actually builds behind the scenes:** the literal shape of your global state tree.
  With the config above, the state tree looks like:
  ```js
  { user: <whatever userReducer's current value is> }
  ```
  The key you chose (`user`) becomes the exact property name you read from later via
  `useSelector`, e.g. `useSelector((state) => state.user)`. The name is arbitrary, but it must
  match consistently between where it's *defined* (`store.js`) and where it's *read*
  (`useSelector` calls elsewhere).
