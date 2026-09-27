import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";

function Signup() {
    
    const [firstName , setFirstName] = useState("");
    const [lastName , setLastName] = useState("");
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [gender , setGender] = useState("")
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSignUpClick = async()=>{
        try{
            const response  = await axios.post('http://localhost:7777/signup' , 
                {
                    firstName,
                    lastName,
                    email,
                    password,
                    gender
                } 
            ,{withCredentials:true}) 

            dispatch(addUser(response.data.data));
            navigate('/profile/edit')
        }
        catch(err){
            console.log(err.message)
        }

       
        
    }
    return (
        <div className="flex justify-center mt-10">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body justify-center">
                    <h2 className="card-title">Sign Up</h2>

                    <label className="label">First Name</label>
                    <input
                        type="text"
                        placeholder="Please type your first name here"
                        className="input input-bordered w-full"
                        value={firstName}
                        onChange={(e)=> setFirstName(e.target.value)}
                    />

                    <label className="label">Last Name</label>
                    <input
                        type="text"
                        placeholder="Please type your last name here"
                        className="input input-bordered w-full"
                        value={lastName}
                        onChange={(e)=> setLastName(e.target.value)}
                    />

                    <label className="label">Email ID</label>
                    <input
                        type="email"
                        placeholder="Please type your email here"
                        className="input input-bordered w-full"
                        value={email}
                        onChange={(e)=> setEmail(e.target.value)}
                    />

                    <label className="label">Password</label>
                    <input
                        type="password"
                        placeholder="Please type your password here"
                        className="input input-bordered w-full"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label className="label">Gender</label>
                    <select 
                        className="select select-bordered w-full"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="others">Others</option>
                    </select>

                    <div className="card-actions justify-center py-4">
                        <button 
                            className="btn btn-primary"
                            onClick={handleSignUpClick}
                        >Sign Up</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;
