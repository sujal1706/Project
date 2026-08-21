import React, { useState } from "react";

import {
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import { motion } from "motion/react";

import axios from "axios";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { ServerUrl } from "../config";

import { setUserData } from "../redux/userSlice";

function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector(
    (state) => state.user
  );

  const [selectedPlan, setSelectedPlan] =
    useState("free");

  const [loadingPlan, setLoadingPlan] =
    useState(null);

  // ============================================================
  // RAZORPAY KEY
  // ============================================================

  const razorpayKey =
    import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();

  // ============================================================
  // PLANS
  // IMPORTANT:
  // amount is in INR here.
  // Backend converts it to paise.
  // ============================================================

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      amount: 0,
      credits: 100,

      description:
        "Perfect for beginners starting interview preparation.",

      features: [
        "100 InterviewIQ.AI Credits",
        "Basic Performance Report",
        "Voice Interview Access",
        "Limited History Tracking",
      ],

      default: true,
    },

    {
      id: "basic",
      name: "Starter Pack",
      price: "₹100",
      amount: 100,
      credits: 150,

      description:
        "Great for focused practice and skill improvement.",

      features: [
        "150 InterviewIQ.AI Credits",
        "Detailed Feedback",
        "Performance Analytics",
        "Full Interview History",
      ],
    },

    {
      id: "pro",
      name: "Pro Pack",
      price: "₹500",
      amount: 500,
      credits: 650,

      description:
        "Best value for serious job preparation.",

      features: [
        "650 InterviewIQ.AI Credits",
        "Advanced AI Feedback",
        "Skill Trend Analysis",
        "Priority AI Processing",
      ],

      badge: "Best Value",
    },
  ];

  // ============================================================
  // REFRESH CURRENT USER
  // ============================================================

  const refreshUser = async () => {
    try {
      console.log("");
      console.log(
        "=========================================="
      );

      console.log(
        "🔄 REFRESHING CURRENT USER"
      );

      console.log(
        "=========================================="
      );

      const response = await axios.get(
        `${ServerUrl}/api/user/current-user`,
        {
          withCredentials: true,
        }
      );

      console.log(
        "Current user response:",
        response.data
      );

      const latestUser =
        response.data?.user ||
        response.data?.data ||
        response.data;

      if (
        latestUser &&
        latestUser.email
      ) {
        console.log(
          "✅ Latest user:",
          latestUser
        );

        console.log(
          "💰 Latest credits:",
          latestUser.credits
        );

        dispatch(
          setUserData(latestUser)
        );

        return latestUser;
      }

      console.error(
        "❌ Invalid current user response"
      );

      return null;
    } catch (error) {
      console.error(
        "❌ Failed to refresh user:",
        error
      );

      console.error(
        "Status:",
        error?.response?.status
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      return null;
    }
  };

  // ============================================================
  // PAYMENT
  // ============================================================

  const handlePayment = async (plan) => {
    console.log("");

    console.log(
      "=========================================="
    );

    console.log(
      "💳 PAYMENT START"
    );

    console.log(
      "=========================================="
    );

    try {
      // ========================================================
      // CHECK LOGIN
      // ========================================================

      if (!userData) {
        alert(
          "Please login before making a payment."
        );

        navigate("/");

        return;
      }

      console.log(
        "Logged in user:",
        userData
      );

      console.log(
        "Current frontend credits:",
        userData?.credits
      );

      // ========================================================
      // CHECK PLAN
      // ========================================================

      if (!plan) {
        alert(
          "Invalid payment plan."
        );

        return;
      }

      if (
        plan.amount <= 0 ||
        plan.id === "free"
      ) {
        alert(
          "Free plan does not require payment."
        );

        return;
      }

      console.log(
        "Selected plan:",
        plan
      );

      // ========================================================
      // VALIDATE PLAN AMOUNT
      // ========================================================

      if (
        typeof plan.amount !== "number" ||
        plan.amount <= 0
      ) {
        alert(
          "Invalid payment amount."
        );

        return;
      }

      // ========================================================
      // VALIDATE CREDITS
      // ========================================================

      if (
        typeof plan.credits !== "number" ||
        plan.credits <= 0
      ) {
        alert(
          "Invalid credit amount."
        );

        return;
      }

      // ========================================================
      // CHECK RAZORPAY
      // ========================================================

      if (!window.Razorpay) {
        console.error(
          "❌ Razorpay Checkout not loaded."
        );

        alert(
          "Razorpay Checkout is not loaded. Please refresh the page."
        );

        return;
      }

      console.log(
        "✅ Razorpay loaded."
      );

      // ========================================================
      // CHECK RAZORPAY KEY
      // ========================================================

      console.log(
        "Razorpay Key exists:",
        Boolean(razorpayKey)
      );

      console.log(
        "Backend:",
        ServerUrl
      );

      if (!razorpayKey) {
        alert(
          "Razorpay Key is missing."
        );

        return;
      }

      // ========================================================
      // LOADING
      // ========================================================

      setLoadingPlan(plan.id);

      // ========================================================
      // CREATE ORDER
      // ========================================================

      console.log("");

      console.log(
        "1️⃣ Creating Razorpay order..."
      );

      console.log(
        "Sending order data:",
        {
          planId: plan.id,
          amount: plan.amount,
          credits: plan.credits,
        }
      );

      const orderResponse =
        await axios.post(
          `${ServerUrl}/api/payment/order`,

          {
            // IMPORTANT
            // Send complete plan information.
            planId: plan.id,

            // Amount in INR.
            // Backend converts INR to paise.
            amount: plan.amount,

            // Credits associated with plan.
            credits: plan.credits,
          },

          {
            withCredentials: true,

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "2️⃣ Order response:",
        orderResponse.data
      );

      // ========================================================
      // CHECK RESPONSE
      // ========================================================

      const backendData =
        orderResponse.data;

      if (!backendData?.success) {
        throw new Error(
          backendData?.message ||
            "Order creation failed."
        );
      }

      // ========================================================
      // GET ORDER
      // ========================================================

      const order =
        backendData.order;

      if (!order) {
        throw new Error(
          "Backend did not return order."
        );
      }

      if (!order.id) {
        throw new Error(
          "Razorpay Order ID missing."
        );
      }

      if (
        !order.amount ||
        Number(order.amount) <= 0
      ) {
        throw new Error(
          "Razorpay Order amount missing or invalid."
        );
      }

      console.log("");

      console.log(
        "========== ORDER CREATED =========="
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
        "==================================="
      );

      // ========================================================
      // RAZORPAY OPTIONS
      // ========================================================

      const options = {
        key: razorpayKey,

        amount: order.amount,

        currency:
          order.currency || "INR",

        name: "InterviewIQ.AI",

        description:
          `${plan.name} - ${plan.credits} Credits`,

        order_id: order.id,

        // ======================================================
        // PREFILL
        // ======================================================

        prefill: {
          name:
            userData?.name || "",

          email:
            userData?.email || "",

          contact:
            userData?.phone ||
            userData?.mobile ||
            "",
        },

        // ======================================================
        // NOTES
        // ======================================================

        notes: {
          planId:
            String(plan.id),

          credits:
            String(plan.credits),
        },

        // ======================================================
        // THEME
        // ======================================================

        theme: {
          color: "#10b981",
        },

        // ======================================================
        // PAYMENT SUCCESS
        // ======================================================

        handler: async function (
          response
        ) {
          console.log("");

          console.log(
            "=========================================="
          );

          console.log(
            "3️⃣ PAYMENT SUCCESS"
          );

          console.log(
            "Razorpay response:",
            response
          );

          console.log(
            "=========================================="
          );

          try {
            // ==================================================
            // CHECK RESPONSE
            // ==================================================

            if (
              !response?.razorpay_payment_id ||
              !response?.razorpay_order_id ||
              !response?.razorpay_signature
            ) {
              throw new Error(
                "Incomplete Razorpay payment response."
              );
            }

            // ==================================================
            // VERIFY PAYMENT
            // ==================================================

            console.log(
              "4️⃣ Verifying payment..."
            );

            const verificationUrl =
              `${ServerUrl}/api/payment/verify`;

            console.log(
              "Verification URL:",
              verificationUrl
            );

            // IMPORTANT:
            // Do NOT trust frontend credits during verification.
            //
            // Backend must read the Razorpay order and determine
            // the actual plan/credits from its own database/config.

            const verifyResponse =
              await axios.post(
                verificationUrl,

                {
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                },

                {
                  withCredentials: true,

                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                }
              );

            // ==================================================
            // VERIFICATION RESPONSE
            // ==================================================

            console.log("");

            console.log(
              "5️⃣ Verify response:"
            );

            console.log(
              verifyResponse.data
            );

            console.log(
              "Verification status:",
              verifyResponse.status
            );

            // ==================================================
            // PAYMENT VERIFIED
            // ==================================================

            if (
              verifyResponse.data?.success
            ) {
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

              // ================================================
              // UPDATE REDUX WITH DATABASE USER
              // ================================================

              const updatedUser =
                verifyResponse.data?.user;

              if (
                updatedUser &&
                updatedUser.email
              ) {
                console.log(
                  "Database user received:",
                  updatedUser
                );

                console.log(
                  "New credits:",
                  updatedUser.credits
                );

                dispatch(
                  setUserData(
                    updatedUser
                  )
                );
              }

              // ================================================
              // REFRESH FROM DATABASE
              // ================================================

              const refreshedUser =
                await refreshUser();

              if (
                refreshedUser
              ) {
                console.log(
                  "✅ Final database credits:",
                  refreshedUser.credits
                );
              }

              // ================================================
              // SUCCESS
              // ================================================

              const addedCredits =
                verifyResponse.data
                  ?.creditsAdded ||
                plan.credits;

              alert(
                `Payment Successful! ${addedCredits} credits added.`
              );

              navigate("/");
            } else {
              console.error(
                "❌ Payment verification failed"
              );

              alert(
                verifyResponse
                  .data
                  ?.message ||
                  "Payment verification failed."
              );
            }
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
              "Error:",
              error
            );

            console.error(
              "Status:",
              error?.response?.status
            );

            console.error(
              "Response:",
              error?.response?.data
            );

            if (
              error?.response?.status ===
              401
            ) {
              alert(
                "Payment was successful, but your login session was not accepted. Please login again."
              );
            } else {
              alert(
                error?.response?.data
                  ?.message ||
                  error?.message ||
                  "Payment verification failed."
              );
            }
          } finally {
            setLoadingPlan(null);
          }
        },

        // ======================================================
        // MODAL DISMISS
        // ======================================================

        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay checkout closed."
            );

            setLoadingPlan(null);
          },
        },
      };

      // ========================================================
      // FINAL OPTIONS
      // ========================================================

      console.log("");

      console.log(
        "6️⃣ FINAL RAZORPAY OPTIONS"
      );

      console.log(options);

      // ========================================================
      // CREATE RAZORPAY CHECKOUT
      // ========================================================

      const razorpay =
        new window.Razorpay(
          options
        );

      // ========================================================
      // PAYMENT FAILED
      // ========================================================

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error("");

          console.error(
            "=========================================="
          );

          console.error(
            "❌ RAZORPAY PAYMENT FAILED"
          );

          console.error(
            "=========================================="
          );

          console.error(
            "Complete response:",
            response
          );

          console.error(
            "Error:",
            response?.error
          );

          console.error(
            "Description:",
            response?.error
              ?.description
          );

          const description =
            response?.error
              ?.description ||
            "Payment failed. Please try another payment method.";

          alert(description);

          setLoadingPlan(null);
        }
      );

      // ========================================================
      // OPEN RAZORPAY
      // ========================================================

      console.log(
        "7️⃣ Opening Razorpay..."
      );

      razorpay.open();

      console.log(
        "8️⃣ Razorpay opened."
      );
    } catch (error) {
      console.error("");

      console.error(
        "=========================================="
      );

      console.error(
        "❌ PAYMENT START ERROR"
      );

      console.error(
        "=========================================="
      );

      console.error(
        "Error:",
        error
      );

      console.error(
        "Backend response:",
        error?.response?.data
      );

      console.error(
        "Status:",
        error?.response?.status
      );

      if (
        error?.response?.status ===
        401
      ) {
        alert(
          "Your login session has expired. Please login again."
        );
      } else {
        alert(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to start payment."
        );
      }

      setLoadingPlan(null);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-gray-50
        to-emerald-50
        py-16
        px-6
      "
    >
      {/* HEADER */}

      <div
        className="
          max-w-6xl
          mx-auto
          mb-14
          flex
          items-start
          gap-4
        "
      >
        <button
          onClick={() => navigate("/")}
          className="
            mt-2
            p-3
            rounded-full
            bg-white
            shadow
            hover:shadow-md
            transition
          "
        >
          <FaArrowLeft
            className="text-gray-600"
          />
        </button>

        <div
          className="
            text-center
            w-full
          "
        >
          <h1
            className="
              text-4xl
              font-bold
              text-gray-800
            "
          >
            Choose Your Plan
          </h1>

          <p
            className="
              text-gray-500
              mt-3
              text-lg
            "
          >
            Flexible pricing to match your
            interview preparation goals.
          </p>
        </div>
      </div>

      {/* PLANS */}

      <div
        className="
          grid
          md:grid-cols-2
          lg:grid-cols-3
          gap-8
          max-w-6xl
          mx-auto
        "
      >
        {plans.map((plan) => {
          const isSelected =
            selectedPlan === plan.id;

          return (
            <motion.div
              key={plan.id}

              whileHover={
                !plan.default
                  ? {
                      scale: 1.03,
                    }
                  : undefined
              }

              onClick={() => {
                if (!plan.default) {
                  setSelectedPlan(
                    plan.id
                  );
                }
              }}

              className={`
                relative
                rounded-3xl
                p-8
                transition-all
                duration-300
                border

                ${
                  isSelected
                    ? "border-emerald-600 shadow-2xl bg-white"
                    : "border-gray-200 bg-white shadow-md"
                }

                ${
                  plan.default
                    ? "cursor-default"
                    : "cursor-pointer"
                }
              `}
            >
              {/* BADGE */}

              {plan.badge && (
                <div
                  className="
                    absolute
                    top-6
                    right-6
                    bg-emerald-600
                    text-white
                    text-xs
                    px-4
                    py-1
                    rounded-full
                    shadow
                  "
                >
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div
                  className="
                    absolute
                    top-6
                    right-6
                    bg-gray-200
                    text-gray-700
                    text-xs
                    px-3
                    py-1
                    rounded-full
                  "
                >
                  Default
                </div>
              )}

              {/* NAME */}

              <h3
                className="
                  text-xl
                  font-semibold
                  text-gray-800
                "
              >
                {plan.name}
              </h3>

              {/* PRICE */}

              <div className="mt-4">
                <span
                  className="
                    text-3xl
                    font-bold
                    text-emerald-600
                  "
                >
                  {plan.price}
                </span>

                <p
                  className="
                    text-gray-500
                    mt-1
                  "
                >
                  {plan.credits} Credits
                </p>
              </div>

              {/* DESCRIPTION */}

              <p
                className="
                  text-gray-500
                  mt-4
                  text-sm
                  leading-relaxed
                "
              >
                {plan.description}
              </p>

              {/* FEATURES */}

              <div
                className="
                  mt-6
                  space-y-3
                  text-left
                "
              >
                {plan.features.map(
                  (feature, index) => (
                    <div
                      key={index}
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <FaCheckCircle
                        className="
                          text-emerald-500
                          text-sm
                        "
                      />

                      <span
                        className="
                          text-gray-700
                          text-sm
                        "
                      >
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* PAYMENT BUTTON */}

              {!plan.default && (
                <button
                  disabled={
                    loadingPlan ===
                    plan.id
                  }

                  onClick={(event) => {
                    event.stopPropagation();

                    if (
                      !isSelected
                    ) {
                      setSelectedPlan(
                        plan.id
                      );

                      return;
                    }

                    handlePayment(plan);
                  }}

                  className={`
                    w-full
                    mt-8
                    py-3
                    rounded-xl
                    font-semibold
                    transition

                    ${
                      isSelected
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                    }

                    ${
                      loadingPlan ===
                      plan.id
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }
                  `}
                >
                  {loadingPlan ===
                  plan.id
                    ? "Processing..."
                    : isSelected
                    ? "Proceed to Pay"
                    : "Select Plan"}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Pricing;