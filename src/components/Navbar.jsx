import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { removeUser } from "../utils/userSlice";
import { useNavigate, Link } from "react-router-dom";

function Navbar() {
  const user = useSelector((store)=>{
    return store.user
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async()=>{
    try{
      await axios.post('http://localhost:7777/logout' , {},{withCredentials:true})

      dispatch(removeUser());
      return navigate('/login')
    }
    catch(err){
      console.log(err)
    }
  }
  return (
    <>

    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">DevTinder</Link>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-hover dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img alt="profile" src={user ? user.photoUrl : "https://placehold.co/100x100"} />
            </div>
          </div>
          { user && 
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
              <li><Link to="/profile/edit">Profile</Link></li>
              <li><Link to="/connections">My Connections</Link></li>
              <li><Link to='/requests'>Requests</Link></li>
              <li><a onClick={handleLogout}>Logout</a></li>
            </ul>
          }
        </div>
      </div>
    </div>
    
    </>
  )
}

export default Navbar;