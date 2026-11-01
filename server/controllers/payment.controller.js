
import Razorpay from "razorpay";
import crypto from "crypto";

import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";

// ======================================================
// RAZORPAY CONFIGURATION
// ======================================================

const razorpay =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// ======================================================
// AVAILABLE PLANS
// Amounts are INR. Razorpay uses paise.
// ======================================================

const PLANS = {
  basic: {
    id: "basic",
    name: "Starter Pack",
    amount: 100,
    credits: 150,
  },

  pro: {
    id: "pro",
    name: "Pro Pack",
    amount: 500,
    credits: 650,
  },
};

// ======================================================
// HELPER: READ REQUEST BODY SAFELY
// ======================================================

const getRequestBody = (req) => {
  let body = req.body;

  // Handle a JSON body that arrived as a string.
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    body = {};
  }

  return body;
};

// ======================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/order
// ======================================================

export const createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured on the server.",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const requestBody = getRequestBody(req);
    const planId = String(requestBody.planId || "").toLowerCase();
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment plan.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const amountInPaise = Math.round(plan.amount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      notes: {
        userId: String(user._id),
        planId: plan.id,
        credits: String(plan.credits),
      },
    });

    // Save order in MongoDB.
    await Payment.create({
      userId: user._id,
      planId: plan.id,
      amount: amountInPaise,
      credits: plan.credits,
      razorpayOrderId: razorpayOrder.id,
      status: "created",
    });

    console.log("RAZORPAY ORDER CREATED:", {
      orderId: razorpayOrder.id,
      planId: plan.id,
      amount: amountInPaise,
    });

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully.",
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        planId: plan.id,
        credits: plan.credits,
      },
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
// ======================================================

export const verifyPayment = async (req, res) => {
  try {
    // --------------------------------------------------
    // 0. CHECK RAZORPAY CONFIGURATION
    // --------------------------------------------------

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured on the server.",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // --------------------------------------------------
    // 1. READ AND DIAGNOSE REQUEST BODY
    // --------------------------------------------------

    const requestBody = getRequestBody(req);

    console.log("========== RAW VERIFY REQUEST ==========");

    console.log("REQUEST METHOD:", req.method);
    console.log("REQUEST PATH:", req.originalUrl);
    console.log("CONTENT TYPE:", req.headers["content-type"]);
    console.log("BODY TYPE:", typeof req.body);
    console.log("BODY IS BUFFER:", Buffer.isBuffer(req.body));
    console.log("BODY KEYS:", Object.keys(requestBody));
    console.log("ORDER ID PRESENT:", Boolean(requestBody.razorpay_order_id));
    console.log("PAYMENT ID PRESENT:", Boolean(requestBody.razorpay_payment_id));
    console.log("SIGNATURE PRESENT:", Boolean(requestBody.razorpay_signature));
    console.log("AUTHENTICATED USER:", String(req.userId));

    console.log("========================================");

    const razorpay_order_id = requestBody.razorpay_order_id;
    const razorpay_payment_id = requestBody.razorpay_payment_id;
    const razorpay_signature = requestBody.razorpay_signature;

    const missingFields = [];

    if (!razorpay_order_id) {
      missingFields.push("razorpay_order_id");
    }

    if (!razorpay_payment_id) {
      missingFields.push("razorpay_payment_id");
    }

    if (!razorpay_signature) {
      missingFields.push("razorpay_signature");
    }

    if (missingFields.length > 0) {
      console.error("PAYMENT VERIFICATION FIELDS MISSING:", missingFields);

      return res.status(400).json({
        success: false,
        message: "Incomplete payment verification data.",
        diagnostic: {
          contentType: req.headers["content-type"] || "missing",
          bodyType: typeof req.body,
          receivedFields: Object.keys(requestBody),
          missingFields,
        },
      });
    }

    // --------------------------------------------------
    // 2. VERIFY RAZORPAY SIGNATURE
    // --------------------------------------------------

    const signatureBody =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(String(razorpay_signature), "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      console.error("RAZORPAY SIGNATURE VERIFICATION FAILED");

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    console.log("RAZORPAY SIGNATURE VERIFIED");

    // --------------------------------------------------
    // 3. FIND SAVED PAYMENT ORDER
    // --------------------------------------------------

    const savedPayment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!savedPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found in database.",
      });
    }

    if (String(savedPayment.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "This payment order does not belong to you.",
      });
    }

    if (
      savedPayment.razorpayPaymentId &&
      savedPayment.razorpayPaymentId !== razorpay_payment_id
    ) {
      return res.status(409).json({
        success: false,
        message: "This order is already linked to another payment.",
      });
    }

    // --------------------------------------------------
    // 4. FETCH AND VERIFY RAZORPAY ORDER
    // --------------------------------------------------

    const razorpayOrder = await razorpay.orders.fetch(
      razorpay_order_id
    );

    if (!razorpayOrder) {
      return res.status(400).json({
        success: false,
        message: "Unable to verify Razorpay order.",
      });
    }

    if (
      String(razorpayOrder.notes?.userId) !== String(req.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Razorpay order ownership verification failed.",
      });
    }

    const plan = PLANS[razorpayOrder.notes?.planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan attached to payment order.",
      });
    }

    const expectedAmount = Math.round(plan.amount * 100);

    if (
      Number(razorpayOrder.amount) !== expectedAmount ||
      Number(savedPayment.amount) !== expectedAmount ||
      razorpayOrder.currency !== "INR" ||
      savedPayment.planId !== plan.id ||
      Number(savedPayment.credits) !== plan.credits
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment order amount or plan verification failed.",
      });
    }

    // --------------------------------------------------
    // 5. FETCH AND VERIFY ACTUAL PAYMENT
    // --------------------------------------------------

    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (!razorpayPayment) {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch Razorpay payment.",
      });
    }

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment does not belong to this order.",
      });
    }

    if (
      Number(razorpayPayment.amount) !== expectedAmount ||
      razorpayPayment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency does not match.",
      });
    }

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: `Payment is not captured. Current status: ${razorpayPayment.status}`,
      });
    }

    console.log("RAZORPAY PAYMENT CAPTURED AND VERIFIED");

    // --------------------------------------------------
    // 6. LINK PAYMENT ID TO SAVED ORDER
    // --------------------------------------------------

    const linkedPayment = await Payment.findOneAndUpdate(
      {
        _id: savedPayment._id,
        $or: [
          { razorpayPaymentId: { $exists: false } },
          { razorpayPaymentId: null },
          { razorpayPaymentId: razorpay_payment_id },
        ],
      },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
        },
      },
      {
        new: true,
      }
    );

    if (!linkedPayment) {
      return res.status(409).json({
        success: false,
        message: "This order is already linked to another payment.",
      });
    }

    // --------------------------------------------------
    // 7. ADD CREDITS ONLY ONCE
    // --------------------------------------------------

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.userId,
        paymentIds: { $ne: razorpay_payment_id },
      },
      {
        $inc: {
          credits: plan.credits,
        },
        $addToSet: {
          paymentIds: razorpay_payment_id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    let finalUser = updatedUser;
    let alreadyCredited = false;

    if (!updatedUser) {
      finalUser = await User.findById(req.userId);

      if (!finalUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      alreadyCredited = finalUser.paymentIds.includes(
        razorpay_payment_id
      );

      if (!alreadyCredited) {
        return res.status(500).json({
          success: false,
          message: "Unable to update user credits.",
        });
      }
    }

    // --------------------------------------------------
    // 8. MARK PAYMENT AS PAID
    // --------------------------------------------------

    await Payment.updateOne(
      {
        _id: linkedPayment._id,
        razorpayPaymentId: razorpay_payment_id,
      },
      {
        $set: {
          status: "paid",
        },
      }
    );

    console.log("========== PAYMENT VERIFIED ==========");

    console.log({
      orderId: razorpay_order_id,
      creditsAdded: alreadyCredited ? 0 : plan.credits,
      currentCredits: finalUser.credits,
      alreadyCredited,
    });

    console.log("======================================");

    // --------------------------------------------------
    // 9. SEND SUCCESS RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      message: alreadyCredited
        ? "Payment was already processed. Credits are up to date."
        : "Payment successful! Credits have been added.",

      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planId: plan.id,
        creditsAdded: alreadyCredited ? 0 : plan.credits,
        alreadyCredited,
      },

      user: {
        id: finalUser._id,
        name: finalUser.name,
        email: finalUser.email,
        credits: finalUser.credits,
      },
    });

  } catch (error) {
    console.error("========== VERIFY PAYMENT ERROR ==========");
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR CODE:", error.code);
    console.error("==========================================");

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This payment or order has already been recorded.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed on the server.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};
