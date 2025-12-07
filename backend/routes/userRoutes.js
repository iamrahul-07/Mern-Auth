import express from 'express'
import { getUserData } from '../controller/userController.js';
import userAuth from '../middleware/userAuth.js';
const userRoute=express.Router();

userRoute.get('/userData',userAuth, getUserData);

export {userRoute};