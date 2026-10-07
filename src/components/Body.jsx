import Navbar from "./Navbar";
import Footer from "./Footer";

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { shortenPlaceName } from "../utils/locationUtils";
import { useEffect, useState } from "react";


function Body(){

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [locationErrorCode, setLocationErrorCode] = useState(null);

    const PUBLIC_ROUTES = ['/login', '/signup' , '/forgotPassword'];

    const fetchUser = async()=>{
        try{
            const response = await axios.post('http://localhost:7777/profile/view' ,{},{
                withCredentials:true
            })

            if(response){
                dispatch(addUser(response.data.data))
                return response.data.data;
            }
        }
        catch(err){
            if(err.response?.status === 401 && !PUBLIC_ROUTES.includes(location.pathname)){
                navigate('/login');
            }
            console.log(err.message);
        }
    }

    const fetchAndUpdateLocation = ()=>{
        navigator.geolocation.getCurrentPosition(
            async(position)=>{
                try{
                    const longitude = position.coords.longitude;
                    const latitude = position.coords.latitude;

                    const reverseResponse = await axios.get(
                        `http://localhost:7777/location/reverse?lat=${latitude}&lon=${longitude}`,
                        {withCredentials:true}
                    );

                    const locationResponse = await axios.patch('http://localhost:7777/user/location', {
                        location:{
                            coordinates:[longitude, latitude]
                        },
                        locationLabel: shortenPlaceName(reverseResponse.data.data.display_name)
                    }, {withCredentials:true});

                    dispatch(addUser(locationResponse.data.data));
                    setLocationErrorCode(null);
                }
                catch(err){
                    console.log(err.message);
                }
            },
            (error)=>{
                console.log(error.message);
                setLocationErrorCode(error.code);
            }
        );
    }

    useEffect(()=>{
        const init = async()=>{
            const fetchedUser = await fetchUser();

            if(fetchedUser?.locationAutoSync !== false){
                fetchAndUpdateLocation();
            }
        }

        init();
    },[])

    return(
        <>
            <Navbar/>

            {locationErrorCode === 1 &&
                <div className="alert alert-warning flex justify-between">
                    <span>You've blocked location access. Enable it in your browser's site settings to see matches near you.</span>
                    <button className="btn btn-sm" onClick={() => setLocationErrorCode(null)}>Dismiss</button>
                </div>
            }

            {locationErrorCode !== null && locationErrorCode !== 1 &&
                <div className="alert alert-warning flex justify-between">
                    <span>Couldn't get your location. Try again to see matches near you.</span>
                    <div className="flex gap-2">
                        <button className="btn btn-sm" onClick={fetchAndUpdateLocation}>Try Again</button>
                        <button className="btn btn-sm" onClick={() => setLocationErrorCode(null)}>Dismiss</button>
                    </div>
                </div>
            }

            <Outlet/>
            <Footer/>
        </>

    )
}


export default Body;