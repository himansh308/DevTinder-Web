# DevTinder Frontend Learning Notes

Personal study notes from building the DevTinder frontend (React + Vite, Tailwind/DaisyUI,
React Router, Redux Toolkit, Axios/CORS auth wiring) — same spirit as the backend's `notes/`
folder: real code, real bugs actually hit, explained the way they were worked through live.

- [react-router-patterns.md](./react-router-patterns.md) — `BrowserRouter`, nested `<Routes>`/`<Route>`, `<Outlet/>` layout pattern, `useNavigate` vs the `<Navigate>` component.
- [redux-toolkit-basics.md](./redux-toolkit-basics.md) — `createSlice`, `configureStore`, default vs. named exports (why `userReducer` and `userSlice.reducer` are "the same thing, different name"), how the `reducer` key shapes the global state tree.
- [cors-and-cookies.md](./cors-and-cookies.md) — CORS `credentials`, `withCredentials`, and the cookie-scoping mix-up that looked like a bug but was a stale-cookie false alarm.
- [tailwind-daisyui-setup.md](./tailwind-daisyui-setup.md) — why versions were pinned (v3/v4, not latest), the `<Div>`/self-closing `<input>` crashes, and the VS Code autocomplete-in-strings setting.
- [session-2026-09-12-13-frontend-setup.md](./session-2026-09-12-13-frontend-setup.md) — chronological log of every bug hit while scaffolding the frontend and wiring up the first Login flow.
- [session-2026-09-22-23-feed-and-route-protection.md](./session-2026-09-22-23-feed-and-route-protection.md) — route protection, logout, feed fetch/render, `UserCard`, single-card-at-a-time swipe logic — 24 bugs/confusions logged, including the recurring "missing `return` in a block-body arrow function" and "calling a handler immediately instead of passing a reference" patterns.
