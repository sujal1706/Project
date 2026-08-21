// ============================================================
// PAYMENT CONTROLLER
// ============================================================

import Razorpay from "razorpay";
import crypto from "crypto";

import User from "../models/user.model.js";

// ============================================================
// RAZORPAY CONFIGURATION
// ============================================================

console.log("");
console.log("==========================================");
console.log("RAZORPAY CONFIGURATION");
console.log("==========================================");

console.log(
    "RAZORPAY_KEY_ID exists:",
    Boolean(process.env.RAZORPAY_KEY_ID)
);

console.log(
    "RAZORPAY_KEY_SECRET exists:",
    Boolean(process.env.RAZORPAY_KEY_SECRET)
);

console.log(
    "RAZORPAY_KEY_ID prefix:",
    process.env.RAZORPAY_KEY_ID
        ? process.env.RAZORPAY_KEY_ID.substring(0, 8)
        : "MISSING"
);

console.log("==========================================");

// ============================================================
// VALIDATE RAZORPAY ENVIRONMENT
// ============================================================

if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
) {
    console.error(
        "❌ Razorpay environment variables are missing."
    );
}

// ============================================================
// CREATE RAZORPAY INSTANCE
// ============================================================

let razorpay = null;

if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
) {
    razorpay = new Razorpay({
        key_id:
            process.env.RAZORPAY_KEY_ID,

        key_secret:
            process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(
        "✅ Razorpay instance initialized successfully"
    );
}

// ============================================================
// PLAN CONFIGURATION
//
// IMPORTANT:
// Amount here is in RUPEES.
// Razorpay order amount will be converted to PAISE.
// ============================================================

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

// ============================================================
// CREATE PAYMENT ORDER
// ============================================================

export const createOrder = async (req, res) => {
    try {
        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            "💳 CREATE PAYMENT ORDER"
        );
        console.log(
            "=========================================="
        );

        // ======================================================
        // CHECK RAZORPAY
        // ======================================================

        if (!razorpay) {
            console.error(
                "❌ Razorpay is not configured."
            );

            return res.status(500).json({
                success: false,
                message:
                    "Razorpay is not configured on the server.",
            });
        }

        // ======================================================
        // CHECK AUTHENTICATION
        // ======================================================

        if (!req.userId) {
            console.error(
                "❌ User ID missing from authentication."
            );

            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        console.log(
            "Authenticated user:",
            req.userId
        );

        // ======================================================
        // GET PLAN ID
        // ======================================================

        const {
            planId,
        } = req.body;

        console.log(
            "Received planId:",
            planId
        );

        // ======================================================
        // VALIDATE PLAN
        // ======================================================

        const plan =
            PLANS[planId];

        if (!plan) {
            console.error(
                "❌ Invalid plan:",
                planId
            );

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment plan.",
            });
        }

        console.log(
            "Selected backend plan:",
            plan
        );

        // ======================================================
        // CONVERT RUPEES TO PAISE
        //
        // ₹100 = 10000 paise
        // ₹500 = 50000 paise
        // ======================================================

        const amountInPaise =
            Math.round(
                plan.amount * 100
            );

        console.log(
            "Amount in rupees:",
            plan.amount
        );

        console.log(
            "Amount in paise:",
            amountInPaise
        );

        // ======================================================
        // FINAL AMOUNT VALIDATION
        // ======================================================

        if (
            !Number.isInteger(
                amountInPaise
            ) ||
            amountInPaise <= 0
        ) {
            console.error(
                "❌ Invalid calculated amount:",
                amountInPaise
            );

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment amount.",
            });
        }

        // ======================================================
        // CREATE RAZORPAY ORDER
        // ======================================================

        const orderOptions = {
            amount:
                amountInPaise,

            currency: "INR",

            receipt:
                `receipt_${Date.now()}_${req.userId
                    .toString()
                    .slice(-6)}`,

            notes: {
                userId:
                    req.userId.toString(),

                planId:
                    plan.id,

                credits:
                    String(plan.credits),
            },
        };

        console.log("");
        console.log(
            "Creating Razorpay order:"
        );

        console.log(
            orderOptions
        );

        const order =
            await razorpay.orders.create(
                orderOptions
            );

        // ======================================================
        // ORDER CREATED
        // ======================================================

        console.log("");
        console.log(
            "✅ RAZORPAY ORDER CREATED"
        );

        console.log(
            "Order ID:",
            order.id
        );

        console.log(
            "Order amount:",
            order.amount
        );

        console.log(
            "Order currency:",
            order.currency
        );

        console.log(
            "=========================================="
        );

        // ======================================================
        // RETURN ORDER TO FRONTEND
        // ======================================================

        return res.status(200).json({
            success: true,

            message:
                "Payment order created successfully.",

            order: {
                id:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency,

                planId:
                    plan.id,

                credits:
                    plan.credits,
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
            "Error:",
            error
        );

        console.error(
            "=========================================="
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Unable to create payment order.",
        });
    }
};

// ============================================================
// VERIFY PAYMENT
// ============================================================

export const verifyPayment = async (req, res) => {
    try {
        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "🔐 VERIFY RAZORPAY PAYMENT"
        );

        console.log(
            "=========================================="
        );

        // ======================================================
        // CHECK AUTHENTICATION
        // ======================================================

        if (!req.userId) {
            console.error(
                "❌ User ID missing."
            );

            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        // ======================================================
        // GET PAYMENT DATA
        // ======================================================

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
        } = req.body;

        console.log(
            "Order ID:",
            razorpay_order_id
        );

        console.log(
            "Payment ID:",
            razorpay_payment_id
        );

        console.log(
            "Plan ID:",
            planId
        );

        // ======================================================
        // VALIDATE DATA
        // ======================================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !planId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Incomplete payment verification data.",
            });
        }

        // ======================================================
        // GET PLAN FROM BACKEND
        // ======================================================

        const plan =
            PLANS[planId];

        if (!plan) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment plan.",
            });
        }

        // ======================================================
        // GENERATE SIGNATURE
        // ======================================================

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

        // ======================================================
        // COMPARE SIGNATURE
        // ======================================================

        const isSignatureValid =
            crypto.timingSafeEqual(
                Buffer.from(
                    generatedSignature
                ),

                Buffer.from(
                    razorpay_signature
                )
            );

        if (!isSignatureValid) {
            console.error(
                "❌ Invalid Razorpay signature."
            );

            return res.status(400).json({
                success: false,
                message:
                    "Payment signature verification failed.",
            });
        }

        console.log(
            "✅ Razorpay signature verified."
        );

        // ======================================================
        // FIND USER
        // ======================================================

        const user =
            await User.findById(
                req.userId
            );

        if (!user) {
            console.error(
                "❌ User not found:",
                req.userId
            );

            return res.status(404).json({
                success: false,
                message:
                    "User not found.",
            });
        }

        // ======================================================
        // CURRENT CREDITS
        // ======================================================

        const oldCredits =
            Number(user.credits) || 0;

        // ======================================================
        // ADD NEW CREDITS
        // ======================================================

        const newCredits =
            oldCredits +
            plan.credits;

        console.log(
            "Old credits:",
            oldCredits
        );

        console.log(
            "Purchased credits:",
            plan.credits
        );

        console.log(
            "New credits:",
            newCredits
        );

        // ======================================================
        // UPDATE DATABASE
        // ======================================================

        user.credits =
            newCredits;

        await user.save();

        console.log(
            "✅ Credits permanently saved to MongoDB."
        );

        // ======================================================
        // RETURN UPDATED USER
        // ======================================================

        return res.status(200).json({
            success: true,

            message:
                "Payment verified and credits added successfully.",

            user: {
                _id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                credits:
                    user.credits,
            },

            payment: {
                orderId:
                    razorpay_order_id,

                paymentId:
                    razorpay_payment_id,

                planId:
                    plan.id,

                creditsAdded:
                    plan.credits,
            },
        });

    } catch (error) {
        console.error("");
        console.error(
            "=========================================="
        );

        console.error(
            "❌ PAYMENT VERIFICATION ERROR"
        );

        console.error(
            "=========================================="
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Payment verification failed.",
        });
    }
};