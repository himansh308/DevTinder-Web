# React Router Patterns

## The layout + `<Outlet/>` pattern — one shell, many interchangeable pages

`Body.jsx` isn't "a page" — it's a **layout shell** that stays visually the same (Navbar always
on top, Footer always on bottom) no matter which URL you're on. `<Outlet/>` is a **placeholder
slot** inside that shell — React Router looks at the current URL, decides which specific page
component matches, and drops that component in wherever `<Outlet/>` sits.

```jsx
// Body.jsx
function Body(){
    return(
        <>
            <Navbar/>
            <Outlet/>
            <Footer/>
        </>
    )
}
```

```jsx
// App.jsx
<Routes>
  <Route path='/' element={<Body/>}>
    <Route path='/' element={<Home/>} />
    <Route path='/login' element={<Login/>} />
    <Route path='/signup' element={<Signup/>} />
    <Route path='/feed' element={<Feed/>} />
  </Route>
</Routes>
```

**Two-step matching, traced with real URLs:**

Visiting `/login`:
1. Outer `<Route path='/' element={<Body/>}>` matches (this parent route wraps every URL under
   the site, not just literally `/`) → renders `Body`.
2. Inside `Body`, at `<Outlet/>`: React Router checks the URL a *second* time, against the
   **nested** routes → `<Route path='/login' element={<Login/>} />` matches → `Login` renders
   there.
3. Final page: `Navbar` (from `Body`) → `Login` (substituted into `Outlet`) → `Footer` (from
   `Body`). `Navbar`/`Footer` never re-mount across different URLs — only the `Outlet` content
   changes.

**Where `<Route>`'s content actually goes — a real bug hit:**
```jsx
<Route path='/'>
  <Body>
    {/* nested routes here */}
  </Body>
</Route>
```
Wrong. `<Route>` doesn't take its content as JSX children like a normal component — it uses an
`element` **prop**, and nested routes go as **children of `<Route>` itself**, not children of
whatever component `element` points to:
```jsx
<Route path='/' element={<Body/>}>
  <Route path='/login' element={<Login/>} />   {/* child of Route, not child of Body */}
</Route>
```

## `useNavigate` (the hook) vs. `<Navigate>` (the component) — easy to mix up

**Bug hit:**
```jsx
import { Navigate } from "react-router-dom";
...
const handleClick = async () => {
    ...
    Navigate('/feed')   // ❌ does nothing
}
```
`<Navigate>` is a **component** — meant to be rendered declaratively in JSX (`<Navigate to="/feed" />`), not called directly as a function. Calling a component like a plain function
(`Navigate('/feed')`) doesn't trigger navigation; it just creates an unused React element
object and moves on.

**The fix — `useNavigate`, the hook** (lowercase `use`, since hooks always start with `use`):
```jsx
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();   // called ONCE, at the top of the component

    const handleClick = async () => {
        ...
        navigate('/feed');   // called later, whenever you actually want to redirect
    }
}
```
`useNavigate()` gives you back a **function** you can call from anywhere inside the component
(event handlers, effects, etc.) — `<Navigate>` the component can only be used by literally
rendering it in JSX, which isn't what you want for "redirect after this async thing succeeds."

## Import case-sensitivity — a filename/import mismatch that only sometimes errors

**Bug hit:**
```jsx
// file is actually named Navbar.jsx
import Navbar from './components/NavBar';   // ❌ capital B in "Bar"
```
On case-sensitive filesystems (Linux, common in deployment/CI) this fails outright with
"module not found." On macOS's default filesystem it may still silently resolve, which is
exactly why this bug can go unnoticed locally and only surface later, elsewhere. Keep import
paths' casing exactly matching the real filename regardless of what your local OS tolerates.
