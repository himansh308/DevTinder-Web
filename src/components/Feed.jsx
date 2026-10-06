import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addFeed, removeUserFromFeed } from "../utils/feedSlice";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserCard from "./UserCard";

function Feed() {

    const feed = useSelector((store)=>{
        return store.feed
    })
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

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

    useEffect(()=>{
        // clear it so a refresh or back-navigation doesn't show it again
        if(location.state?.toast){
            navigate(location.pathname, { replace:true, state:null });
        }
    },[location.state, location.pathname, navigate])

    useEffect(()=>{
        if(!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    },[toastMessage])


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

        {toastMessage &&
            <div className="toast toast-top toast-center">
                <div className="alert alert-success">
                    <span>{toastMessage}</span>
                </div>
            </div>
        }

        </>
    )
}


export default Feed;