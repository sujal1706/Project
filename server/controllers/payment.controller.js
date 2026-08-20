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
// CREATE ORDER
// ============================================================

export const createOrder = async (req, res) => {
  try {
    console.log("");
    console.log("==========================================");
    console.log("CREATE RAZORPAY ORDER");
    console.log("==========================================");

    console.log("User:", req.user?._id);

    console.log(
      "RAZORPAY_KEY_ID exists:",
      Boolean(
        process.env.RAZORPAY_KEY_ID
      )
    );

    console.log(
      "RAZORPAY_KEY_SECRET exists:",
      Boolean(
        process.env.RAZORPAY_KEY_SECRET
      )
    );

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

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    if (!credits || credits <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credits",
      });
    }

    // ========================================================
    // IMPORTANT
    // Razorpay amount is in PAISE
    //
    // ₹100 = 10000 paise
    // ₹500 = 50000 paise
    // ========================================================

    const amountInPaise =
      Math.round(Number(amount) * 100);

    console.log(
      "Amount in rupees:",
      amount
    );

    console.log(
      "Amount in paise:",
      amountInPaise
    );

    // ========================================================
    // CREATE RAZORPAY ORDER
    // ========================================================

    const options = {
      amount: amountInPaise,

      currency: "INR",

      receipt:
        `receipt_${Date.now()}`,

      notes: {
        planId: String(planId),
        credits: String(credits),
        userId: String(
          req.user?._id || ""
        ),
      },
    };

    console.log(
      "Razorpay order options:",
      options
    );

    const order =
      await razorpay.orders.create(
        options
      );

    console.log("");
    console.log(
      "✅ Razorpay order created:"
    );

    console.log(order);

    console.log(
      "=========================================="
    );

    return res.status(200).json({
      success: true,

      message:
        "Razorpay order created successfully",

      order: {
        id: order.id,

        entity: order.entity,

        amount: order.amount,

        amount_paid:
          order.amount_paid,

        amount_due:
          order.amount_due,

        currency: order.currency,

        receipt: order.receipt,

        status: order.status,

        notes: order.notes,
      },
    });

  } catch (error) {
    console.error("");
    console.error(
      "=========================================="
    );
    console.error(
      "❌ CREATE ORDER ERROR"
    );
    console.error(
      "=========================================="
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Status:",
      error.statusCode
    );

    console.error(
      "Description:",
      error.description
    );

    console.error(
      "Full error:",
      error
    );

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
// VERIFY PAYMENT
// ============================================================

export const verifyPayment = async (
  req,
  res
) => {
  try {
    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "VERIFY RAZORPAY PAYMENT"
    );
    console.log(
      "=========================================="
    );

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      credits,
    } = req.body;

    console.log("Order ID:", razorpay_order_id);

    console.log(
      "Payment ID:",
      razorpay_payment_id
    );

    console.log(
      "Plan ID:",
      planId
    );

    console.log(
      "Credits:",
      credits
    );

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incomplete Razorpay payment response",
      });
    }

    // ========================================================
    // GENERATE SIGNATURE
    // ========================================================

    const generatedSignature =
      crypto
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
    // VERIFY
    // ========================================================

    if (
      generatedSignature !==
      razorpay_signature
    ) {
      console.error(
        "❌ Invalid Razorpay signature"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid payment signature",
      });
    }

    console.log(
      "✅ Razorpay signature verified"
    );

    // ========================================================
    // FIND USER
    // ========================================================

    const userId =
      req.user?._id;

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // ADD CREDITS
    // ========================================================

    const creditsToAdd =
      Number(credits);

    if (
      !Number.isFinite(
        creditsToAdd
      ) ||
      creditsToAdd <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid credits amount",
      });
    }

    user.credits =
      Number(user.credits || 0) +
      creditsToAdd;

    await user.save();

    console.log(
      "✅ Credits added:",
      creditsToAdd
    );

    console.log(
      "New credit balance:",
      user.credits
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Payment verified and credits added",

      user,
    });

  } catch (error) {
    console.error("");
    console.error(
      "=========================================="
    );
    console.error(
      "❌ VERIFY PAYMENT ERROR"
    );
    console.error(
      "=========================================="
    );

    console.error(error);

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Payment verification failed",
    });
  }
};