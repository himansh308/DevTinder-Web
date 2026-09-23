import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addFeed, removeUserFromFeed } from "../utils/feedSlice";
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
    

    const handleSendRequest = async(status, userId) =>{
        try{
            const sendRequestResponse = await axios.post(`http://localhost:7777/request/send/${status}/${userId}` , {} ,{withCredentials:true})

            if(sendRequestResponse){
                dispatch(removeUserFromFeed(userId))
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
            feed[0] === undefined ? (
                <h1> You have seen everyone </h1>
            )
            : (
                <UserCard key={feed[0]._id} user={feed[0]}  
                    onInterested={()=>handleSendRequest("interested" , feed[0]._id)} 
                    onIgnored ={()=> handleSendRequest("ignored" , feed[0]._id)}>
                </UserCard>
            )
            
        
        }
        
        </>
    )
}


export default Feed;