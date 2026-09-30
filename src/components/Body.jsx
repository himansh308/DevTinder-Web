import Navbar from "./Navbar";
import Footer from "./Footer";

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useEffect } from "react";


function Body(){

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const PUBLIC_ROUTES = ['/login', '/signup'];

    const fetchUser = async()=>{
        try{
            const response = await axios.post('http://localhost:7777/profile/view' ,{},{
                withCredentials:true
            })

            if(response){
                dispatch(addUser(response.data.data))
            }
        }
        catch(err){
            if(err.response?.status === 401 && !PUBLIC_ROUTES.includes(location.pathname)){
                navigate('/login');
            }
            console.log(err.message);
        }
    }

    useEffect(()=>{
        fetchUser();
    },[])
    return(
        <>
            <Navbar/>
            <Outlet/>
            <Footer/>
        </>
        
    )
}


export default Body;