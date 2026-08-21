import Razorpay from "razorpay";
import crypto from "crypto";

import User from "../models/user.model.js";

// ============================================================
// RAZORPAY CONFIGURATION CHECK
// ============================================================

const razorpayKeyId =
    process.env.RAZORPAY_KEY_ID?.trim();

const razorpayKeySecret =
    process.env.RAZORPAY_KEY_SECRET?.trim();

console.log("");
console.log("==========================================");
console.log("RAZORPAY CONFIGURATION");
console.log("==========================================");

console.log(
    "RAZORPAY_KEY_ID exists:",
    Boolean(razorpayKeyId)
);

console.log(
    "RAZORPAY_KEY_SECRET exists:",
    Boolean(razorpayKeySecret)
);

if (razorpayKeyId) {
    console.log(
        "RAZORPAY_KEY_ID prefix:",
        razorpayKeyId.substring(0, 8)
    );
}

console.log("==========================================");

// ============================================================
// RAZORPAY INSTANCE
// ============================================================

let razorpay = null;

if (
    razorpayKeyId &&
    razorpayKeySecret
) {
    razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
    });

    console.log(
        "✅ Razorpay instance initialized successfully"
    );
} else {
    console.error(
        "❌ Razorpay is NOT configured."
    );

    console.error(
        "Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env"
    );
}

// ============================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/order
// ============================================================

export const createOrder = async (
    req,
    res
) => {

    try {

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "CREATE RAZORPAY ORDER"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Authenticated User:",
            req.user?._id
        );

        // ========================================================
        // CHECK RAZORPAY CONFIGURATION
        // ========================================================

        if (!razorpay) {

            console.error(
                "❌ Razorpay instance is not configured"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Razorpay is not configured on the server. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
            });
        }

        // ========================================================
        // REQUEST BODY
        // ========================================================

        const {
            planId,
            amount,
            credits,
        } = req.body;

        console.log(
            "Request body:",
            {
                planId,
                amount,
                credits,
            }
        );

        // ========================================================
        // AUTHENTICATION CHECK
        // ========================================================

        if (!req.user?._id) {

            return res.status(401).json({
                success: false,
                message:
                    "User authentication required",
            });

        }

        // ========================================================
        // VALIDATE PLAN
        // ========================================================

        if (!planId) {

            return res.status(400).json({
                success: false,
                message:
                    "planId is required",
            });

        }

        // ========================================================
        // VALIDATE AMOUNT
        // ========================================================

        const amountInRupees =
            Number(amount);

        if (
            !Number.isFinite(
                amountInRupees
            ) ||
            amountInRupees <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment amount",
            });

        }

        // ========================================================
        // VALIDATE CREDITS
        // ========================================================

        const creditsAmount =
            Number(credits);

        if (
            !Number.isFinite(
                creditsAmount
            ) ||
            creditsAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid credits",
            });

        }

        // ========================================================
        // CONVERT RUPEES TO PAISE
        // ========================================================

        const amountInPaise =
            Math.round(
                amountInRupees * 100
            );

        console.log(
            "Amount in rupees:",
            amountInRupees
        );

        console.log(
            "Amount in paise:",
            amountInPaise
        );

        // ========================================================
        // CREATE RECEIPT
        // ========================================================

        const receipt =
            `receipt_${Date.now()}_${String(
                req.user._id
            ).slice(-6)}`;

        // ========================================================
        // RAZORPAY ORDER OPTIONS
        // ========================================================

        const options = {

            amount:
                amountInPaise,

            currency:
                "INR",

            receipt,

            notes: {

                planId:
                    String(planId),

                credits:
                    String(creditsAmount),

                userId:
                    String(
                        req.user._id
                    ),
            },
        };

        console.log(
            "Razorpay order options:",
            options
        );

        // ========================================================
        // CREATE ORDER
        // ========================================================

        const order =
            await razorpay.orders.create(
                options
            );

        // ========================================================
        // SUCCESS
        // ========================================================

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "✅ RAZORPAY ORDER CREATED"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Order ID:",
            order.id
        );

        console.log(
            "Amount:",
            order.amount
        );

        console.log(
            "Currency:",
            order.currency
        );

        console.log(
            "Status:",
            order.status
        );

        console.log(
            "=========================================="
        );

        return res.status(200).json({

            success: true,

            message:
                "Razorpay order created successfully",

            order: {

                id:
                    order.id,

                entity:
                    order.entity,

                amount:
                    order.amount,

                amount_paid:
                    order.amount_paid,

                amount_due:
                    order.amount_due,

                currency:
                    order.currency,

                receipt:
                    order.receipt,

                status:
                    order.status,

                notes:
                    order.notes,
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
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
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

        // ========================================================
        // CHECK RAZORPAY CONFIGURATION
        // ========================================================

        if (
            !razorpayKeySecret
        ) {

            return res.status(500).json({
                success: false,
                message:
                    "Razorpay secret is not configured on the server",
            });

        }

        // ========================================================
        // AUTHENTICATED USER
        // ========================================================

        const userId =
            req.user?._id;

        console.log(
            "Authenticated User:",
            userId
        );

        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    "User authentication required",
            });

        }

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

        console.log(
            "Credits:",
            credits
        );

        // ========================================================
        // VALIDATE RAZORPAY RESPONSE
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
        // FIND USER
        // ========================================================

        const user =
            await User.findById(
                userId
            );

        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found",
            });

        }

        // ========================================================
        // VALIDATE CREDITS
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

        // ========================================================
        // GENERATE SIGNATURE
        // ========================================================

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    razorpayKeySecret
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
        // SAFE SIGNATURE COMPARISON
        // ========================================================

        const generatedBuffer =
            Buffer.from(
                generatedSignature,
                "utf8"
            );

        const receivedBuffer =
            Buffer.from(
                razorpay_signature,
                "utf8"
            );

        if (
            generatedBuffer.length !==
            receivedBuffer.length
        ) {

            console.error(
                "❌ Invalid Razorpay signature length"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature",
            });

        }

        const isSignatureValid =
            crypto.timingSafeEqual(
                generatedBuffer,
                receivedBuffer
            );

        if (!isSignatureValid) {

            console.error(
                "❌ INVALID RAZORPAY SIGNATURE"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature",
            });

        }

        console.log(
            "✅ RAZORPAY SIGNATURE VERIFIED"
        );

        // ========================================================
        // ADD CREDITS
        // ========================================================

        const oldCredits =
            Number(
                user.credits || 0
            );

        const newCredits =
            oldCredits +
            creditsToAdd;

        user.credits =
            newCredits;

        await user.save();

        // ========================================================
        // SUCCESS LOG
        // ========================================================

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "✅ PAYMENT VERIFIED SUCCESSFULLY"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "User ID:",
            user._id
        );

        console.log(
            "Plan ID:",
            planId
        );

        console.log(
            "Credits added:",
            creditsToAdd
        );

        console.log(
            "Previous credits:",
            oldCredits
        );

        console.log(
            "New credits:",
            newCredits
        );

        console.log(
            "=========================================="
        );

        // ========================================================
        // RESPONSE
        // ========================================================

        return res.status(200).json({

            success: true,

            message:
                "Payment verified and credits added successfully",

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

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Stack:",
            error.stack
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Payment verification failed",
        });

    }
};