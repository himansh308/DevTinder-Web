import { createSlice } from "@reduxjs/toolkit";


const feedSlice = createSlice({

    name:"feed",
    initialState:[],
    reducers:{
        addFeed:(state,action )=>{
            return action.payload
        },
        removeFeed:(state,action) =>{
            return []
        },
        removeUserFromFeed:(state,action)=>{
            return state.filter((user)=> user._id !== action.payload)
        }
    }
})

export const{ addFeed, removeFeed, removeUserFromFeed} = feedSlice.actions;

export default  feedSlice.reducer;