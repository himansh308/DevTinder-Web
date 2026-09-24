import axios from "axios";
import { useState , useEffect} from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import UserCard from "./UserCard";


function EditProfile() {
   const user = useSelector((store)=>{
       return store.user
   })
    const dispatch = useDispatch();

    const [firstName , setFirstName] = useState(user?.firstName);
    const [lastName , setLastName] = useState(user?.lastName);
    const [age , setAge] = useState(user?.age);
    const [photoUrl , setPhotoUrl] = useState(user?.photoUrl);
    const [skills , setSkills] = useState(user?.skills ? user.skills.join(", ") : "");
    const [error, setError] = useState("");

    useEffect(()=>{
        if(user){
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setAge(user.age);
            setPhotoUrl(user.photoUrl);
            setSkills(user.skills ? user.skills.join(", ") : "");
        }
    },[user])

    if (!user){
        return <h1>Loading...</h1>;
    }

   const previewUser = {
        firstName,
        lastName,
        age,
        photoUrl,
        gender: user.gender,
        skills: skills.split(",").map((skill) => skill.trim()).filter((skill) => skill.length > 0)
    };

   const handleSaveProfileButton = async()=>{
        setError("");
        try{
            const response = await axios.patch('http://localhost:7777/profile/edit' , 
                {
                    firstName,
                    lastName,
                    age,
                    photoUrl,
                    skills:previewUser.skills
                },
                {withCredentials:true})

            if(response){
                dispatch(addUser(response.data.data))
            }
        }
        catch(err){
            setError(err.response?.data || "Something went wrong")
        }
   }

   
    return (
        <div className="flex flex-wrap justify-center gap-8 mt-10">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Edit Profile</h2>

                    <label className="label">First Name</label>
                    <input 
                        type="text" 
                        className="input input-bordered w-full" 
                        value={firstName}
                        onChange={(e)=> setFirstName(e.target.value)}
                    />

                    <label className="label">Last Name</label>
                    <input 
                        type="text" 
                        className="input input-bordered w-full"
                        value={lastName}
                        onChange={(e)=> setLastName(e.target.value)}
                     />

                    <label className="label">Age</label>
                    <input 
                        type="number" 
                        className="input input-bordered w-full" 
                        value={age}
                        onChange={(e)=>setAge(e.target.value)}
                    />

                    <label className="label">Photo URL</label>
                    <input 
                        type="text" 
                        className="input input-bordered w-full" 
                        value={photoUrl}
                        onChange={(e)=> setPhotoUrl(e.target.value)}
                    />

                    <label className="label">Skills </label>
                    <input 
                        type="text" 
                        className="input input-bordered w-full" 
                        value={skills}
                        onChange={(e)=> setSkills(e.target.value)}
                    />

                    {error && <p className="text-error text-sm mt-2">{error}</p>}

                    <div className="card-actions justify-center py-4">
                        <button 
                            className="btn btn-primary"
                            onClick={handleSaveProfileButton}
                        >Save Profile</button>
                    </div>
                </div>
            </div>

            
                
            <UserCard user={previewUser}></UserCard>
            
        </div>
    );
}

export default EditProfile;
