import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import { text } from "express";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../config/emailTemplate.js";

//REGISTER CONTROLLER
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User Already exist" });
    }
    //PASSWORD ENCRYPTION BEFORE SAVING
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    //GENERATING JWT TOKEN
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Welcome to Auth",
      text: `Welcome to Auth Website. Your account is created with email : ${email}`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "User Created Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//LOGIN CONTROLLER
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and Password is required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid email!" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Password!" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true, message: "Login Successfully!" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//LOGOUT CONTROLLER
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logout Successfully!" });
  } catch (error) {
    return res.json({ success: false, message: "Logout Successfully!" });
  }
};

//SEND VERIFICATION OTP AT USER'S EMAIL
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "User is already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your Verification OTP is ${otp}. Verify Your Account using this OTP`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };

    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "Verification OTP is Sent on Registered Email",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//VERIFY ACCOUNT USING OTP
export const verifyEmail = async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing details" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not Found" });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//CHECK IF USER IS AUTHENTICATED
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//SEND RESET OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Password Reset Otp",
      // text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password`
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "An OTP has been emailed to you for resetting your password.",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//RESET PASSWORD
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp) {
    return res.json({
      success: false,
      message: "Email, OTP and New Password is required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: true, message: "Invalid Otp" });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    return res.json({
      success: true,
      message: "Password has been Reset Successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
