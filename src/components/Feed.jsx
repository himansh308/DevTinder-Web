import axios from "axios";
import { useDispatch } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import { useEffect } from "react";


function Feed() {

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
        <div>
            This is the Feed Page.
        </div>
        </>
    )
}


export default Feed;