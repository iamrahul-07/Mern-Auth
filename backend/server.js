import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dbConnect } from "./config/connection.js";
import authRoute from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import { userRoute } from "./routes/userRoutes.js";

const app = express();
const allowedOrigin = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://mern-auth-frontend-m7ys.onrender.com",
];

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(cookieParser());
dotenv.config();
dbConnect();

const PORT = process.env.PORT || 4000;

//API ENDPOINTS
app.get("/", (req, res) => {
  res.send("API Working");
});

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);

app.listen(PORT, () => {
  console.log("Server is running on Port : ", PORT);
});
