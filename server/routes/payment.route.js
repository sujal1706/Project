import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import isAuth from "../middlewares/isAuth.js";

const paymentRouter = express.Router();

// ============================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/order
// ============================================================
paymentRouter.post(
  "/order",
  isAuth,
  createOrder
);

// ============================================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
// ============================================================
paymentRouter.post(
  "/verify",
  isAuth,
  verifyPayment
);

export default paymentRouter;