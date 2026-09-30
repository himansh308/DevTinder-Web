import axios from "axios";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

function MutualConnections (){
    const {candidateId} = useParams();
    
    const fetchMutualConnections = async()=>{

        try{

            const response = await axios.get(`http://localhost:7777/user/mutual-connections/${candidateId}`,{withCredentials:true})

            console.log(response);
        }
        catch(err){
            console.log(err.message)
        }
    }

    useEffect(()=>{
        fetchMutualConnections();
    },[])
    return(
        <>
        <div>Mutual connections</div>
        </>
    )
}


export default MutualConnections;