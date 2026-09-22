import { configureStore } from "@reduxjs/toolkit";

import useReducer from './userSlice';
import feedReducer from './feedSlice';


const store = configureStore({
    reducer:{
        user:useReducer,
        feed:feedReducer
    }
})

export default store;
