import { User } from "../models/userModel.js";

export const getUserData=async (req, res)=>{
    const userId=req.userId;
    const user=await User.findById(userId);
    if(!user){
        return res.json({success:false , message: "User Not Found"});
    }
    return res.json({success: true, userData:{
        name: user.name,
        isAccountVerified: user.isAccountVerified,
        email: user.email
    }})
}