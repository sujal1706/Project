import Razorpay from "razorpay";
import crypto from "crypto";

import User from "../models/user.model.js";

// ============================================================
// RAZORPAY INSTANCE
// ============================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/order
// ============================================================

export const createOrder = async (req, res) => {
  try {
    console.log("");
    console.log("==========================================");
    console.log("CREATE RAZORPAY ORDER");
    console.log("==========================================");

    console.log("User ID:", req.user?._id);

    console.log(
      "RAZORPAY_KEY_ID exists:",
      Boolean(process.env.RAZORPAY_KEY_ID)
    );

    console.log(
      "RAZORPAY_KEY_SECRET exists:",
      Boolean(process.env.RAZORPAY_KEY_SECRET)
    );

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const {
      planId,
      amount,
      credits,
    } = req.body;

    console.log("Request body:", {
      planId,
      amount,
      credits,
    });

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    if (
      credits === undefined ||
      credits === null ||
      Number(credits) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid credits",
      });
    }

    // ========================================================
    // CONVERT RUPEES TO PAISE
    //
    // ₹100  = 10000 paise
    // ₹500  = 50000 paise
    // ========================================================

    const amountInPaise =
      Math.round(Number(amount) * 100);

    console.log("Amount in rupees:", Number(amount));
    console.log("Amount in paise:", amountInPaise);

    // ========================================================
    // CREATE RAZORPAY ORDER
    // ========================================================

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,

      notes: {
        planId: String(planId),
        credits: String(credits),
        userId: String(req.user?._id || ""),
      },
    };

    console.log("Razorpay order options:", options);

    const order = await razorpay.orders.create(options);

    // ========================================================
    // ORDER CREATED
    // ========================================================

    console.log("");
    console.log("==========================================");
    console.log("✅ RAZORPAY ORDER CREATED");
    console.log("==========================================");

    console.log("Order ID:", order.id);
    console.log("Amount:", order.amount);
    console.log("Currency:", order.currency);
    console.log("Status:", order.status);

    console.log("==========================================");

    return res.status(200).json({
      success: true,

      message: "Razorpay order created successfully",

      order: {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        notes: order.notes,
      },
    });
  } catch (error) {
    console.error("");
    console.error("==========================================");
    console.error("❌ CREATE ORDER ERROR");
    console.error("==========================================");

    console.error("Message:", error.message);
    console.error("Status:", error.statusCode);
    console.error("Description:", error.description);
    console.error("Full error:", error);

    return res.status(500).json({
      success: false,

      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        "Unable to create Razorpay order",
    });
  }
};

// ============================================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
// ============================================================

export const verifyPayment = async (req, res) => {
  try {
    console.log("");
    console.log("==========================================");
    console.log("VERIFY RAZORPAY PAYMENT");
    console.log("==========================================");

    console.log("Authenticated User:", req.user?._id);

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      credits,
    } = req.body;

    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Plan ID:", planId);
    console.log("Credits:", credits);

    // ========================================================
    // VALIDATE RAZORPAY RESPONSE
    // ========================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      console.error(
        "❌ Incomplete Razorpay payment response"
      );

      return res.status(400).json({
        success: false,
        message: "Incomplete Razorpay payment response",
      });
    }

    // ========================================================
    // CHECK RAZORPAY SECRET
    // ========================================================

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error(
        "❌ RAZORPAY_KEY_SECRET is missing"
      );

      return res.status(500).json({
        success: false,
        message: "Razorpay secret is not configured",
      });
    }

    // ========================================================
    // GENERATE SIGNATURE
    // ========================================================

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    console.log(
      "Generated signature:",
      generatedSignature
    );

    console.log(
      "Received signature:",
      razorpay_signature
    );

    // ========================================================
    // VERIFY SIGNATURE
    // ========================================================

    const isSignatureValid =
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!isSignatureValid) {
      console.error(
        "❌ INVALID RAZORPAY SIGNATURE"
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    console.log(
      "✅ RAZORPAY SIGNATURE VERIFIED"
    );

    // ========================================================
    // CHECK AUTHENTICATED USER
    // ========================================================

    const userId = req.user?._id;

    if (!userId) {
      console.error(
        "❌ User ID missing from authentication"
      );

      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(userId);

    if (!user) {
      console.error(
        "❌ User not found:",
        userId
      );

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // VALIDATE CREDITS
    // ========================================================

    const creditsToAdd = Number(credits);

    if (
      !Number.isFinite(creditsToAdd) ||
      creditsToAdd <= 0
    ) {
      console.error(
        "❌ Invalid credits:",
        credits
      );

      return res.status(400).json({
        success: false,
        message: "Invalid credits amount",
      });
    }

    // ========================================================
    // ADD CREDITS
    // ========================================================

    const oldCredits = Number(
      user.credits || 0
    );

    const newCredits =
      oldCredits + creditsToAdd;

    user.credits = newCredits;

    await user.save();

    console.log("");
    console.log("==========================================");
    console.log("✅ PAYMENT VERIFIED SUCCESSFULLY");
    console.log("==========================================");

    console.log("User ID:", user._id);
    console.log("Plan ID:", planId);
    console.log("Credits added:", creditsToAdd);
    console.log("Previous credits:", oldCredits);
    console.log("New credits:", newCredits);

    console.log("==========================================");

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Payment verified and credits added successfully",

      user: user,
    });
  } catch (error) {
    console.error("");
    console.error("==========================================");
    console.error("❌ VERIFY PAYMENT ERROR");
    console.error("==========================================");

    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Payment verification failed",
    });
  }
};