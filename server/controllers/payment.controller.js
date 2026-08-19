import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/razorpay.service.js";
import crypto from "crypto";

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================
export const createOrder = async (req, res) => {
  try {
    console.log("========================================");
    console.log("RAZORPAY CREATE ORDER STARTED");
    console.log("========================================");

    console.log("User ID:", req.userId);
    console.log("Request body:", req.body);

    const { planId, amount, credits } = req.body;

    // =================================================
    // 1. VALIDATE REQUEST DATA
    // =================================================
    if (!planId || amount === undefined || credits === undefined) {
      console.error("Invalid plan data:", {
        planId,
        amount,
        credits,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid plan data",
      });
    }

    // =================================================
    // 2. VALIDATE AMOUNT
    // =================================================
    const numericAmount = Number(amount);
    const numericCredits = Number(credits);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      console.error("Invalid amount:", amount);

      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    if (
      !Number.isFinite(numericCredits) ||
      numericCredits <= 0
    ) {
      console.error("Invalid credits:", credits);

      return res.status(400).json({
        success: false,
        message: "Invalid credits",
      });
    }

    // =================================================
    // 3. CHECK USER
    // =================================================
    if (!req.userId) {
      console.error("User ID missing from request");

      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    // =================================================
    // 4. CHECK RAZORPAY CONFIGURATION
    // =================================================
    if (!process.env.RAZORPAY_KEY_ID) {
      console.error("RAZORPAY_KEY_ID is missing");

      return res.status(500).json({
        success: false,
        message:
          "Razorpay Key ID is not configured on server",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET is missing");

      return res.status(500).json({
        success: false,
        message:
          "Razorpay Key Secret is not configured on server",
      });
    }

    console.log(
      "Razorpay Key ID:",
      process.env.RAZORPAY_KEY_ID.substring(0, 10) + "..."
    );

    console.log("Razorpay Secret:", "PRESENT");

    // =================================================
    // 5. CREATE RAZORPAY ORDER OPTIONS
    // =================================================

    const options = {
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Razorpay order options:", options);

    // =================================================
    // 6. CREATE RAZORPAY ORDER
    // =================================================

    let order;

    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error("========================================");
      console.error("RAZORPAY API ERROR");
      console.error("========================================");

      console.error(
        "Message:",
        razorpayError?.message
      );

      console.error(
        "Description:",
        razorpayError?.error?.description
      );

      console.error(
        "Code:",
        razorpayError?.error?.code
      );

      console.error(
        "Status Code:",
        razorpayError?.statusCode
      );

      console.error(
        "Reason:",
        razorpayError?.error?.reason
      );

      console.error(
        "Full Razorpay error:",
        razorpayError
      );

      return res.status(500).json({
        success: false,
        message: "Razorpay order creation failed",
        error:
          razorpayError?.error?.description ||
          razorpayError?.message ||
          "Unknown Razorpay error",
      });
    }

    // =================================================
    // 7. CHECK ORDER
    // =================================================

    if (!order || !order.id) {
      console.error(
        "Razorpay returned invalid order:",
        order
      );

      return res.status(500).json({
        success: false,
        message:
          "Razorpay did not return a valid order",
      });
    }

    console.log(
      "Razorpay order created successfully:",
      order.id
    );

    // =================================================
    // 8. SAVE PAYMENT IN DATABASE
    // =================================================

    const payment = await Payment.create({
      userId: req.userId,
      planId,
      amount: numericAmount,
      credits: numericCredits,
      razorpayOrderId: order.id,
      status: "created",
    });

    console.log(
      "Payment saved in MongoDB:",
      payment._id
    );

    // =================================================
    // 9. SEND RESPONSE
    // =================================================

    console.log("========================================");
    console.log(
      "RAZORPAY CREATE ORDER SUCCESS"
    );
    console.log("========================================");

    return res.status(200).json({
      success: true,
      message:
        "Razorpay order created successfully",
      order,
    });
  } catch (error) {
    // =================================================
    // GENERAL ERROR
    // =================================================

    console.error("========================================");
    console.error(
      "GENERAL RAZORPAY CREATE ORDER ERROR"
    );
    console.error("========================================");

    console.error(
      "Error message:",
      error?.message
    );

    console.error(
      "Error description:",
      error?.error?.description
    );

    console.error(
      "Error code:",
      error?.error?.code
    );

    console.error(
      "Status code:",
      error?.statusCode
    );

    console.error(
      "Full error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create Razorpay order",
      error:
        error?.error?.description ||
        error?.message ||
        "Unknown server error",
    });
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================
export const verifyPayment = async (req, res) => {
  try {
    console.log("========================================");
    console.log(
      "RAZORPAY PAYMENT VERIFICATION STARTED"
    );
    console.log("========================================");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // =================================================
    // 1. VALIDATE PAYMENT DATA
    // =================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      console.error(
        "Missing Razorpay payment details"
      );

      return res.status(400).json({
        success: false,
        message:
          "Missing Razorpay payment details",
      });
    }

    // =================================================
    // 2. CHECK RAZORPAY SECRET
    // =================================================

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error(
        "RAZORPAY_KEY_SECRET is missing"
      );

      return res.status(500).json({
        success: false,
        message:
          "Razorpay Key Secret is not configured",
      });
    }

    // =================================================
    // 3. CREATE SIGNATURE
    // =================================================

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    // =================================================
    // 4. VERIFY SIGNATURE
    // =================================================

    if (
      expectedSignature !==
      razorpay_signature
    ) {
      console.error(
        "Invalid Razorpay payment signature"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid payment signature",
      });
    }

    console.log(
      "Razorpay signature verified"
    );

    // =================================================
    // 5. FIND PAYMENT
    // =================================================

    const payment = await Payment.findOne({
      razorpayOrderId:
        razorpay_order_id,
    });

    if (!payment) {
      console.error(
        "Payment not found:",
        razorpay_order_id
      );

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // =================================================
    // 6. PREVENT DUPLICATE PAYMENT
    // =================================================

    if (payment.status === "paid") {
      console.log(
        "Payment already processed"
      );

      return res.status(200).json({
        success: true,
        message:
          "Payment already processed",
      });
    }

    // =================================================
    // 7. UPDATE PAYMENT
    // =================================================

    payment.status = "paid";
    payment.razorpayPaymentId =
      razorpay_payment_id;

    await payment.save();

    console.log(
      "Payment marked as paid:",
      payment._id
    );

    // =================================================
    // 8. ADD CREDITS TO USER
    // =================================================

    const updatedUser =
      await User.findByIdAndUpdate(
        payment.userId,
        {
          $inc: {
            credits: payment.credits,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedUser) {
      console.error(
        "User not found:",
        payment.userId
      );

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "Credits added:",
      payment.credits
    );

    console.log(
      "Updated user credits:",
      updatedUser.credits
    );

    // =================================================
    // 9. SUCCESS RESPONSE
    // =================================================

    console.log("========================================");
    console.log(
      "RAZORPAY PAYMENT VERIFIED SUCCESSFULLY"
    );
    console.log("========================================");

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and credits added",
      user: updatedUser,
    });
  } catch (error) {
    // =================================================
    // GENERAL VERIFICATION ERROR
    // =================================================

    console.error("========================================");
    console.error(
      "RAZORPAY PAYMENT VERIFICATION ERROR"
    );
    console.error("========================================");

    console.error(
      "Error message:",
      error?.message
    );

    console.error(
      "Error code:",
      error?.code
    );

    console.error(
      "Full error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify Razorpay payment",
      error:
        error?.message ||
        "Unknown payment verification error",
    });
  }
};