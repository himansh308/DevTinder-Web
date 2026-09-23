import { useState } from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom';
import Body from './components/Body';
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import Feed from './components/Feed';
import EditProfile from './components/EditProfile';

function App() {

  return (
    <>
    <Routes>
      <Route path='/' element={<Body/>}>
        <Route path='/' element={<Home/>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/signup' element={<Signup/>}></Route>
        <Route path='/feed' element={<Feed/>}></Route>
        <Route path='/profile/edit' element={<EditProfile/>}></Route>
      </Route>
    </Routes>
    </>
  )
}

export default App
