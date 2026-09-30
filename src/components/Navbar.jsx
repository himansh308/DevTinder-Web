import axios from "axios";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeUser } from "../utils/userSlice";
import { useNavigate, Link } from "react-router-dom";

function Navbar() {
  const user = useSelector((store)=>{
    return store.user
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

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

  const handleDeleteAccount = async()=>{
    try{
      await axios.delete('http://localhost:7777/delete', {withCredentials:true})

      document.getElementById('delete_modal').close();
      dispatch(removeUser());
      return navigate('/login')
    }
    catch(err){
      console.log(err)
      setDeleteError("Something went wrong while deleting your account. Please try again.")
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
              <li className="my-1"><hr /></li>
              <li>
                <a
                  className="text-error"
                  onClick={() => {
                    setDeleteError("");
                    document.getElementById('delete_modal').showModal();
                  }}
                >
                  Delete Account
                </a>
              </li>
            </ul>
          }
        </div>
      </div>
    </div>
    <dialog id="delete_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">Delete Account</h3>
          <p className="py-4">
            This action is permanent and cannot be undone. Type <span className="font-bold">DELETE</span> to confirm.
          </p>

          <input
            type="text"
            placeholder="Type DELETE to confirm"
            className="input input-bordered w-full"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />

          {deleteError && <p className="text-error text-sm mt-2">{deleteError}</p>}

          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn" onClick={() => { setConfirmText(""); setDeleteError(""); }}>Cancel</button>
            </form>
            <button
              type="button"
              className="btn btn-error"
              disabled={confirmText !== "DELETE"}
              onClick={handleDeleteAccount}
            >
              Delete My Account
            </button>
          </div>
        </div>
    </dialog>
    </>
  )
}

export default Navbar;