import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import { useEffect } from "react";
import UserCard from "./UserCard";

function Feed() {

    const feed = useSelector((store)=>{
        return store.feed
    })
    const dispatch = useDispatch();

    const fetchFeed = async() =>{
        

        try{
            const response = await axios.get('http://localhost:7777/feed' , {withCredentials:true})

            if(response){
                dispatch(addFeed(response.data.data))
            }
        }
        catch(err){
            console.log(err.message)
        }
    }
    

    useEffect(()=>{

        fetchFeed();

    },[])


    return(
        <>
        {
            feed.map((user)=>{
                return <UserCard key={user._id} user={user}></UserCard>
            })
        }
        
        </>
    )
}


export default Feed;