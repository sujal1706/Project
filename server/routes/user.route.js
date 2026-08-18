import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getCurrentUser } from "../controllers/user.controller.js";

const userRouter = express.Router();

// Get currently logged-in user
userRouter.get("/current-user", isAuth, getCurrentUser);

export default userRouter;