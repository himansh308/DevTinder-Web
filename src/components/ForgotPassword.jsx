import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword(){
    // TODO: state — email, OTP, newPassword, confirmPassword, step ("email" | "reset"), error
    const [email, setEmail] = useState("");
    const[OTP , setOTP] = useState("");
    const[newPassword , setNewPassword] = useState("");
    const[confirmPassword, setConfirmPassword] = useState("");
    const[error , setError] = useState("");
    const[step, setStep] = useState("email");
    const navigate = useNavigate();

    const handleSendOtp = async()=>{
        
        setError("")
        try{
            await axios.post('http://localhost:7777/forgotPassword' ,{email} )
            setStep("reset")
        }
        catch(err){
            setError(err.response?.data || "Something went wrong")
        }
    }

    const handleResetPassword = async() =>{
        setError("")
        try{
            await axios.post('http://localhost:7777/resetPassword' , {
                email,
                OTP,
                newPassword,
                confirmPassword
            })

            navigate('/login')

        }
        catch(err){
            setError(err.response?.data || "Something went wrong")
        }
    }
    return(
        <div className="flex justify-center mt-10">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">

                    {step === "email" && (
                        <>
                            <h2 className="card-title">Forgot Password</h2>
                            <p className="text-sm opacity-70">
                                Enter your registered email and we'll send you an OTP.
                            </p>

                            <label className="label">Email ID</label>
                            <input
                                type="email"
                                placeholder="Please type your email here"
                                className="input input-bordered w-full"
                                value={email}
                                onChange={(e)=> setEmail(e.target.value)}
                            />

                            <div className="card-actions justify-center py-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSendOtp}
                                >
                                    Send OTP
                                </button>
                            </div>
                        </>
                    )}

                    {step === "reset" && (
                        <>
                            <h2 className="card-title">Reset Password</h2>
                            <p className="text-sm opacity-70">
                                Enter the OTP sent for {email} and choose a new password.
                            </p>

                            <label className="label">OTP</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="6-digit OTP"
                                className="input input-bordered w-full"
                                value={OTP}
                                onChange={(e) => setOTP(e.target.value)}
                            />

                            <label className="label">New Password</label>
                            <input
                                type="password"
                                placeholder="New password"
                                className="input input-bordered w-full"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />

                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                className="input input-bordered w-full"
                                value={confirmPassword}
                                onChange={(e)=> setConfirmPassword(e.target.value)}
                            />

                            <div className="card-actions justify-center py-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleResetPassword}
                                >
                                    Reset Password
                                </button>
                            </div>
                        </>
                    )}

                    {error && <p className="text-error text-sm">{error}</p>}

                    <p className="text-right text-sm">
                        Remembered it? <Link to="/login" className="link link-primary">Back to Login</Link>
                    </p>

                </div>
            </div>
        </div>
    )
}

export default ForgotPassword;
