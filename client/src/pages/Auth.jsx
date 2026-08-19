import React from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";

import { ServerUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function Auth({ isModel = false }) {
  const dispatch = useDispatch();

  const handleGoogleAuth = async () => {
    try {
      console.log("1. Google login started");

      let name = "";
      let email = "";

      // ==============================
      // ANDROID APK
      // ==============================
      if (Capacitor.isNativePlatform()) {
        console.log("2. Running on native Android");

        const result =
          await FirebaseAuthentication.signInWithGoogle();

        console.log("3. Native Firebase login successful");
        console.log("Firebase result:", result);

        const user = result.user;

        name = user?.displayName || "";
        email = user?.email || "";

        console.log("Firebase user:", {
          name,
          email,
        });
      }

      // ==============================
      // WEBSITE
      // ==============================
      else {
        console.log("2. Running on web");

        const { signInWithPopup } = await import("firebase/auth");
        const { auth, provider } = await import("../utils/firebase");

        const response = await signInWithPopup(auth, provider);

        console.log("3. Web Firebase login successful");

        const user = response.user;

        name = user?.displayName || "";
        email = user?.email || "";

        console.log("Firebase user:", {
          name,
          email,
        });
      }

      // ==============================
      // CHECK FIREBASE USER
      // ==============================
      if (!email) {
        throw new Error(
          "Firebase did not return an email address."
        );
      }

      // ==============================
      // SEND USER TO BACKEND
      // ==============================
      console.log("4. Sending user to backend");
      console.log("Backend URL:", ServerUrl);

      const result = await axios.post(
        `${ServerUrl}/api/auth/google`,
        {
          name,
          email,
        },
        {
          withCredentials: true,
        }
      );

      console.log("5. Backend login successful");
      console.log("Backend response:", result.data);

      // IMPORTANT:
      // Backend returns:
      //
      // {
      //   success: true,
      //   message: "...",
      //   user: {...}
      // }
      //
      // Redux must receive result.data.user
      // NOT result.data

      if (!result.data?.user) {
        throw new Error(
          "Backend login succeeded but user data was not returned."
        );
      }

      console.log(
        "6. Saving user in Redux:",
        result.data.user
      );

      dispatch(setUserData(result.data.user));

      console.log("7. User saved successfully");

    } catch (error) {
      console.error("Google Login Error:", error);

      if (error?.response) {
        console.error(
          "Backend response:",
          error.response.data
        );

        console.error(
          "Backend status:",
          error.response.status
        );
      }

      if (error?.request) {
        console.error(
          "Request was sent but no response was received."
        );
      }

      dispatch(setUserData(null));
    }
  };

  return (
    <div
      className={`
        w-full
        ${
          isModel
            ? "py-4"
            : "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"
        }
      `}
    >
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.05 }}
        className={`
          w-full
          ${
            isModel
              ? "max-w-md p-8 rounded-3xl"
              : "max-w-lg p-12 rounded-[32px]"
          }
          bg-white shadow-2xl border border-gray-200
        `}
      >

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <h2 className="font-semibold text-lg">
            InterviewIQ.AI
          </h2>
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
          Continue with

          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2 ml-2">
            <IoSparkles size={16} />
            AI Smart Interview
          </span>
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">
          Sign in to start AI-powered mock interviews,
          track your progress, and unlock detailed
          performance insights.
        </p>

        {/* Google Button */}
        <motion.button
          onClick={handleGoogleAuth}
          whileHover={{
            opacity: 0.9,
            scale: 1.03,
          }}
          whileTap={{
            opacity: 1,
            scale: 0.98,
          }}
          className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md"
        >
          <FcGoogle size={20} />

          Continue with Google
        </motion.button>

      </motion.div>
    </div>
  );
}

export default Auth;