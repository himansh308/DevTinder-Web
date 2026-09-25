import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addRequest, removeRequest } from "../utils/requestSlice";
import { useEffect, useState } from "react";

function Request(){
    const requests = useSelector((store)=> store.requests)
    const dispatch = useDispatch();

    const [showToast , setShowToast] = useState(false);
    const [lastStatus , setLastStatus] = useState("");

    const pendingRequest = async()=>{
        try{    
            const response = await axios.get('http://localhost:7777/user/requests/received' , {withCredentials:true});

            if(response){
                console.log(response.data.data);
                dispatch(addRequest(response.data.data));
            }
        }
        catch(err){
            console.log(err.message)
        }
    }

   const handleRequestButtonClicked = async(status,requestId)=>{

        try{
            const response  = await axios.post(`http://localhost:7777/request/review/${status}/${requestId}`,{} ,{withCredentials:true});
            if(response){
                dispatch(removeRequest(requestId))
                setLastStatus(status);
                setShowToast(true);
                setTimeout(()=>{
                    setShowToast(false)
                },3000)
            }
        }
        catch(err){
            console.log(err.message);
        }
   }

    useEffect(()=>{
        pendingRequest()
    },[])
    return (
        <>
        {requests.map((request)=>{
            return (
                
                <div key={request._id} className="card card-border bg-base-100 w-96 shadow-md">
                        <div className="card-body flex-row items-center gap-4">
                            <img
                                src={request?.fromUserId?.photoUrl}
                                alt={`${request?.fromUserId?.firstName} ${request?.fromUserId?.lastName}`}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                            <div>
                                <h2 className="card-title">{request?.fromUserId?.firstName} {request?.fromUserId?.lastName}</h2>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {request?.fromUserId?.skills?.map((skill, index) => (
                                        <span key={index} className="badge badge-secondary">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-origin-border">
                            <button 
                                className="my-2 mx-4" 
                                onClick={()=> handleRequestButtonClicked("accepted" , request._id)}

                            >Accept</button>
                            <button 
                                className= "my-2 mx-4 "
                                onClick={()=> handleRequestButtonClicked("rejected" , request._id)}
                            >Reject</button>
                        </div>
                </div>
                
                
                
                
            )
        })}
        {showToast && <div className="toast toast-top toast-center">
                    <div className="alert alert-success">
                        <span>Request {lastStatus} successfully</span>
                    </div>
                </div>
                }
       
        </>
        
    )
}


export default Request;