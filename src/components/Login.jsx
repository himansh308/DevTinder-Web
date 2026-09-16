import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

function Login(){
    const [emailId , setEmailId] = useState("you@test.com");
    const [password , setPassword] = useState("Test123@#$");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleClick = async()=>{
        try{
            const resposne = await axios.post('http://localhost:7777/login',{
                email:emailId,
                password,password
            },{withCredentials:true});

            dispatch(addUser(resposne.data.data))
            navigate('/feed');
        }   
        catch(err){
            console.log(err);
        }
    }
    return(
        <>  
        <div className="flex justify-center mt-10">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body justify-center">
                    <h2 className="card-title">Login</h2>
                    <label className="label">Email ID</label>
                    <input 
                        type='email'   
                        placeholder="Please type your email here"
                        className="input input-bordered w-full"
                        value={emailId}
                        onChange={(e)=> setEmailId(e.target.value)}
                    />
                    <label className="label">password</label>
                    <input 
                        type="password"
                        placeholder="Please type your password here"
                        className="input input-bordered w-full"
                        value={password}
                        onChange={(e)=> setPassword(e.target.value)}
                    /> 
                    <div className="card-actions justify-center py-4">
                    <button 
                        className="btn btn-primary"
                        onClick={handleClick}
                        >Login
    
                    </button>
                    </div>
                </div>
            </div>
        </div>
            
        </>
    )
}


export default Login;