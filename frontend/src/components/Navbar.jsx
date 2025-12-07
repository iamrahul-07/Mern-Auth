import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const Navbar = () => {
  const { userData, backendUrl, setUserData, setIsLoggedIn } = useContext(AppContent);
  const navigate = useNavigate();

  const logout = async ()=>{
    try {
        axios.defaults.withCredentials=true;
        const {data} =await axios.post(backendUrl + '/api/auth/logout');
        data.success && setIsLoggedIn(false);
        data.success && setUserData(false);
        navigate("/");
    } catch (error) {
        toast.error(error.message);
    }
  }

  const sendVerificationOtp=async()=>{
    try {
        axios.defaults.withCredentials=true;
        const {data} =await axios.post(backendUrl + "/api/auth/send-verify-otp");
        if(data.success){
            navigate("email-verify");
            toast.success(data.message)
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message);
    }
  }
  return (
    <div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0">
      <img src={assets.logo} alt="" className="w-28 sm:h-32" />
      {userData ? (
        <div className="w-10 h-10 flex justify-center items-center bg-black text-white rounded-full relative group">
          {userData.name[0].toUpperCase()}
          <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
            <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
                {!userData.isAccountVerified && <li onClick={sendVerificationOtp} className="py-1 px-2 hover:bg-gray-200 cursor-pointer">Verify Email</li>}
                <li onClick={logout} className="py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10">Logout</li>
            </ul>
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 border border-gray-500 text-gray-800 hover:bg-gray-100 transition-all cursor-pointer rounded-full py-2 px-8 font-semibold"
        >
          Login <img src={assets.arrow_icon} alt="" className="" />
        </button>
      )}
    </div>
  );
};

export default Navbar;
