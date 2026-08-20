import express from "express";

import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

import isAuth from "../middlewares/isAuth.js";

const paymentRouter = express.Router();

// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

paymentRouter.post(
  "/order",
  isAuth,
  createOrder
);

// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

paymentRouter.post(
  "/verify",
  isAuth,
  verifyPayment
);

export default paymentRouter;