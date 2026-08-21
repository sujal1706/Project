import express from "express";

import {
    currentUser,
} from "../controllers/user.controller.js";

import isAuth from "../middlewares/isAuth.js";

const userRouter = express.Router();


// ============================================================
// CURRENT USER
// ============================================================

userRouter.get(
    "/current-user",
    isAuth,
    currentUser
);


export default userRouter;