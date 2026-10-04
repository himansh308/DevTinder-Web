import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { shortenPlaceName } from "../utils/locationUtils";
import { useNavigate } from "react-router-dom";

function ProfilePreferences() {
    
    const user = useSelector((store) =>{
        return store.user;
    })

    const [genderPreference , setGenderPreference] = useState(user?.genderPreference || []);
    const [minAge , setMinAge] = useState(user?.minAge || 18);
    const [maxAge , setMaxAge] = useState(user?.maxAge || 60);
    const [maxDistance , setMaxDistance] = useState(user?.maxDistance || 10)
    const [error , setError] = useState('');
    const [showToast , setShowToast] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [places, setPlaces] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const latestQueryRef = useRef('');

    const dispatch = useDispatch();
    const navigate = useNavigate();


    const toggleGenderPreference = (gender) => {
        if(genderPreference.includes(gender)){
            setGenderPreference(genderPreference.filter((g) => g !== gender));
        }
        else{
            setGenderPreference([...genderPreference, gender]);
        }
    }

    const handleSearchTextChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        latestQueryRef.current = value;
    }

    const handleSelectPlace = (place) => {
        setSelectedLocation({...place, autoSync:false});
        setSearchText(place.display_name);
        setPlaces([]);
    }

    const handleUseCurrentLocation = () => {
        setError('');
        navigator.geolocation.getCurrentPosition(
            async(position)=>{
                try{
                    const longitude = position.coords.longitude;
                    const latitude = position.coords.latitude;

                    const reverseResponse = await axios.get(
                        `http://localhost:7777/location/reverse?lat=${latitude}&lon=${longitude}`,
                        {withCredentials:true}
                    );

                    const displayName = reverseResponse.data.data.display_name;

                    setSelectedLocation({display_name:displayName, lat:latitude, lon:longitude, autoSync:true});
                    setSearchText(displayName);
                    setPlaces([]);
                }
                catch(err){
                    console.log(err.message);
                }
            },
            (error)=>{
                console.log(error.message);
                setError("Couldn't get your current location. Please check your browser's permission settings.");
            }
        );
    }

    const handleProfilePreferenceSaveButton = async()=>{
        setError('');
        try{
            const response = await axios.patch('http://localhost:7777/profile/preferences', {
                genderPreference,
                minAge: Number(minAge),
                maxAge: Number(maxAge),
                maxDistance: Number(maxDistance)
            } , {withCredentials:true});

            dispatch(addUser(response.data.data));

            if(selectedLocation){
                const locationResponse = await axios.patch('http://localhost:7777/user/location', {
                    location:{
                        coordinates:[Number(selectedLocation.lon), Number(selectedLocation.lat)]
                    },
                    locationLabel: shortenPlaceName(selectedLocation.display_name),
                    locationAutoSync: selectedLocation.autoSync
                } , {withCredentials:true});

                dispatch(addUser(locationResponse.data.data));
                setSelectedLocation(null);
            }

            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            navigate('/feed')
        }
        catch(err){
            setError(err.response?.data || "Something went wrong");
        }
    }


    useEffect(()=>{
        if(user){
            setGenderPreference(user.genderPreference || []);
            setMinAge(user.minAge || 18);
            setMaxAge(user.maxAge || 60);
            setMaxDistance(user.maxDistance || 10);
        }
    },[user])

    useEffect(()=>{
        if(searchText.trim().length === 0){
            setPlaces([]);
            return;
        }

        const timer = setTimeout(async()=>{
            try{
                const response = await axios.get(
                    `http://localhost:7777/location/search?q=${encodeURIComponent(searchText)}`,
                    {withCredentials:true}
                );

                if(searchText === latestQueryRef.current){
                    setPlaces(response.data.data);
                }
            }
            catch(err){
                console.log(err.message);
            }
        }, 1000);

        return () => clearTimeout(timer);
    },[searchText])
    return (
        <div className="flex justify-center mt-10">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Feed Preferences</h2>

                    <label className="label">Interested In</label>
                    <div className="flex flex-col gap-2">
                        <label className="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={genderPreference.includes("male")}
                                onChange={() => toggleGenderPreference("male")}
                            />
                            Male
                        </label>
                        <label className="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={genderPreference.includes("female")}
                                onChange={() => toggleGenderPreference("female")}
                            />
                            Female
                        </label>
                        <label className="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={genderPreference.includes("others")}
                                onChange={() => toggleGenderPreference("others")}
                            />
                            Others
                        </label>
                    </div>

                    <label className="label">Age Range</label>
                    <div className="flex gap-4">
                        <input
                            type="number"
                            placeholder="Min Age"
                            className="input input-bordered w-full"                          
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Max Age"
                            className="input input-bordered w-full"
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                        />
                    </div>

                    <label className="label">Max Distance (km)</label>
                    <input
                        type="number"
                        placeholder="Max Distance"
                        className="input input-bordered w-full"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(e.target.value)}
                    />

                    <label className="label">Your Location</label>

                    {user?.locationLabel &&
                        <p className="text-sm opacity-70">Current location: {user.locationLabel}</p>
                    }

                    <input
                        type="text"
                        placeholder="Search for a place (e.g. Nehru Place)"
                        className="input input-bordered w-full"
                        value={searchText}
                        onChange={handleSearchTextChange}
                    />

                    {places.length > 0 &&
                        <ul className="menu bg-base-100 rounded-box shadow w-full">
                            {places.map((place) => (
                                <li key={place.lat + place.lon}>
                                    <a onClick={() => handleSelectPlace(place)}>{place.display_name}</a>
                                </li>
                            ))}
                        </ul>
                    }

                    <button
                        type="button"
                        className="btn btn-ghost btn-sm self-start"
                        onClick={handleUseCurrentLocation}
                    >
                        📍 Use My Current Location
                    </button>

                    {error && <p className="text-error text-sm mt-2">{error}</p>}

                    <div className="card-actions justify-center py-4">
                        <button
                            className="btn btn-primary"
                            onClick={handleProfilePreferenceSaveButton}
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>

            {showToast &&
                <div className="toast toast-top toast-center">
                    <div className="alert alert-success">
                        <span>Preferences saved successfully</span>
                    </div>
                </div>
            }
        </div>
    );
}

export default ProfilePreferences;
