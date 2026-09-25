import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addConnection } from "../utils/connectionSlice";

function Connections() {
    const Myconnections = useSelector((store)=>{
        return store.connections;
    })
    const dispatch = useDispatch();

    const connectionRequest = async()=>{
        try{
            const response  = await axios.get('http://localhost:7777/user/connections' , {withCredentials:true})
            if(response){
                dispatch(addConnection(response.data.data));
                console.log(response.data.data)
            }
        }
        catch(err){
            console.log(err.message)
        }
    }

    useEffect(()=>{
        connectionRequest()
    },[])
    return (
        <div className="flex flex-col items-center gap-4 py-8">
            {
                Myconnections.map((connection)=>(
                    <div key={connection._id} className="card card-border bg-base-100 w-96 shadow-md">
                        <div className="card-body flex-row items-center gap-4">
                            <img
                                src={connection.photoUrl}
                                alt={`${connection.firstName} ${connection.lastName}`}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                            <div>
                                <h2 className="card-title">{connection.firstName} {connection.lastName}</h2>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {connection.skills?.map((skill, index) => (
                                        <span key={index} className="badge badge-secondary">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default Connections;