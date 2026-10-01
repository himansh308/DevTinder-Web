import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function MutualConnections (){
    const {candidateId} = useParams();
    const [mutualConnections, setMutualConnections] = useState([]);

    const fetchMutualConnections = async()=>{
        try{
            const response = await axios.get(`http://localhost:7777/user/mutual-connections/${candidateId}`,{withCredentials:true})

            setMutualConnections(response.data.data);
        }
        catch(err){
            console.log(err.message)
        }
    }

    useEffect(()=>{
        fetchMutualConnections();
    },[candidateId])

    return(
        <>
        <h2 className="text-2xl font-bold text-center mt-8">Mutual Connections</h2>

        <div className="flex flex-col items-center gap-4 py-8">
            {mutualConnections.length === 0 && (
                <p className="text-center opacity-70">No mutual connections found.</p>
            )}

            {mutualConnections.map((mutualCandidate)=>(
                <div key={mutualCandidate._id} className="card card-border bg-base-100 w-96 shadow-md">
                    <div className="card-body flex-row items-center gap-4">
                        <img
                            src={mutualCandidate.photoUrl}
                            alt={`${mutualCandidate.firstName} ${mutualCandidate.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                            <h2 className="card-title">
                                {mutualCandidate.firstName} {mutualCandidate.lastName}
                                {mutualCandidate.age && <span className="text-base font-normal ml-1">, {mutualCandidate.age}</span>}
                            </h2>
                            {mutualCandidate.gender && <p className="text-sm opacity-70">{mutualCandidate.gender}</p>}
                            <div className="flex flex-wrap gap-2 mt-1">
                                {mutualCandidate.skills?.map((skill, index) => (
                                    <span key={index} className="badge badge-secondary">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        </>
    )
}


export default MutualConnections;