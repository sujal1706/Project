import React, { useState } from "react";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import { ServerUrl } from "../App";
import { setUserData } from "../redux/userSlice";

function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user);

  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(null);

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

  const handlePayment = async (plan) => {
    try {
      // ==========================================
      // 1. CHECK LOGIN
      // ==========================================

      if (!userData) {
        alert("Please login before making a payment.");
        navigate("/");
        return;
      }

      // ==========================================
      // 2. CHECK RAZORPAY SCRIPT
      // ==========================================

      if (!window.Razorpay) {
        console.error("Razorpay object not found.");
        alert(
          "Razorpay Checkout is not loaded. Please refresh the page."
        );
        return;
      }

      // ==========================================
      // 3. GET RAZORPAY KEY
      // ==========================================

      const razorpayKey =
        import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();

      console.log("========== PAYMENT START ==========");
      console.log("Plan:", plan);
      console.log("Backend URL:", ServerUrl);
      console.log("Razorpay Key:", razorpayKey);

      if (!razorpayKey) {
        alert("Razorpay Key ID is missing.");
        return;
      }

      setLoadingPlan(plan.id);

      // ==========================================
      // 4. CREATE ORDER ON BACKEND
      // ==========================================

      console.log("1. Creating Razorpay order...");

      const orderResponse = await axios.post(
        `${ServerUrl}/api/payment/order`,
        {
          planId: plan.id,
          amount: plan.amount,
          credits: plan.credits,
        },
        {
          withCredentials: true,
        }
      );

      const order = orderResponse.data;

      console.log("2. Order created:", order);

      if (!order?.id) {
        throw new Error(
          "Backend did not return a Razorpay order ID."
        );
      }

      console.log("Razorpay Order ID:", order.id);
      console.log("Order Amount:", order.amount);
      console.log("Order Currency:", order.currency);

      // ==========================================
      // 5. CREATE RAZORPAY OPTIONS
      // ==========================================

      const options = {
        key: razorpayKey,

        amount: order.amount,

        currency: order.currency || "INR",

        name: "InterviewIQ.AI",

        description: `${plan.name} - ${plan.credits} Credits`,

        order_id: order.id,

        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
        },

        theme: {
          color: "#10b981",
        },

        handler: async function (response) {
          console.log(
            "3. Razorpay payment successful"
          );

          console.log(
            "Razorpay response:",
            response
          );

          try {
            // ======================================
            // VERIFY PAYMENT
            // ======================================

            console.log(
              "4. Verifying payment..."
            );

            const verifyResponse =
              await axios.post(
                `${ServerUrl}/api/payment/verify`,
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
                }
              );

            console.log(
              "5. Verification response:",
              verifyResponse.data
            );

            if (verifyResponse.data?.success) {
              if (verifyResponse.data.user) {
                dispatch(
                  setUserData(
                    verifyResponse.data.user
                  )
                );
              }

              alert(
                "Payment Successful! Credits Added."
              );

              navigate("/");
            } else {
              alert(
                "Payment verification failed."
              );
            }
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            console.error(
              "Response:",
              error?.response?.data
            );

            alert(
              error?.response?.data?.message ||
                "Payment completed but verification failed."
            );
          } finally {
            setLoadingPlan(null);
          }
        },

        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay checkout closed."
            );

            setLoadingPlan(null);
          },
        },
      };

      console.log(
        "6. Final Razorpay options:",
        options
      );

      // ==========================================
      // 6. OPEN RAZORPAY
      // ==========================================

      console.log(
        "7. Opening Razorpay checkout..."
      );

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response?.error
          );

          alert(
            response?.error?.description ||
              "Payment failed."
          );

          setLoadingPlan(null);
        }
      );

      razorpay.open();

    } catch (error) {
      console.error(
        "========== PAYMENT ERROR =========="
      );

      console.error(error);

      console.error(
        "Backend response:",
        error?.response?.data
      );

      console.error(
        "Backend status:",
        error?.response?.status
      );

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start payment."
      );

      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-16 px-6">

      {/* HEADER */}

      <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">

        <button
          onClick={() => navigate("/")}
          className="mt-2 p-3 rounded-full bg-white shadow hover:shadow-md transition"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>

        <div className="text-center w-full">

          <h1 className="text-4xl font-bold text-gray-800">
            Choose Your Plan
          </h1>

          <p className="text-gray-500 mt-3 text-lg">
            Flexible pricing to match your interview
            preparation goals.
          </p>

        </div>

      </div>

      {/* PLANS */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {plans.map((plan) => {

          const isSelected =
            selectedPlan === plan.id;

          return (
            <motion.div
              key={plan.id}

              whileHover={
                !plan.default
                  ? { scale: 1.03 }
                  : undefined
              }

              onClick={() => {
                if (!plan.default) {
                  setSelectedPlan(plan.id);
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
                <div className="absolute top-6 right-6 bg-emerald-600 text-white text-xs px-4 py-1 rounded-full shadow">
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div className="absolute top-6 right-6 bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                  Default
                </div>
              )}

              {/* NAME */}

              <h3 className="text-xl font-semibold text-gray-800">
                {plan.name}
              </h3>

              {/* PRICE */}

              <div className="mt-4">

                <span className="text-3xl font-bold text-emerald-600">
                  {plan.price}
                </span>

                <p className="text-gray-500 mt-1">
                  {plan.credits} Credits
                </p>

              </div>

              {/* DESCRIPTION */}

              <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                {plan.description}
              </p>

              {/* FEATURES */}

              <div className="mt-6 space-y-3 text-left">

                {plan.features.map(
                  (feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >

                      <FaCheckCircle className="text-emerald-500 text-sm" />

                      <span className="text-gray-700 text-sm">
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
                    loadingPlan === plan.id
                  }

                  onClick={(event) => {

                    event.stopPropagation();

                    if (!isSelected) {
                      setSelectedPlan(plan.id);
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
                        ? "bg-emerald-600 text-white hover:opacity-90"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                    }
                  `}
                >

                  {loadingPlan === plan.id
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