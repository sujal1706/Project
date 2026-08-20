import React, { useState } from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

import {
  FirebaseAuthentication,
} from "@capacitor-firebase/authentication";

import {
  Capacitor,
} from "@capacitor/core";

import { ServerUrl } from "../config";

import {
  useDispatch,
} from "react-redux";

import {
  setUserData,
} from "../redux/userSlice";

function Auth({ isModel = false }) {

  const dispatch = useDispatch();

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleGoogleAuth = async () => {

    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {

      console.log(
        "================================"
      );

      console.log(
        "GOOGLE LOGIN STARTED"
      );

      console.log(
        "Platform:",
        Capacitor.getPlatform()
      );

      console.log(
        "Native:",
        Capacitor.isNativePlatform()
      );

      console.log(
        "Backend:",
        ServerUrl
      );

      console.log(
        "================================"
      );

      if (!ServerUrl) {
        throw new Error(
          "Backend URL is missing. Check VITE_API_URL."
        );
      }

      let name = "";
      let email = "";

      // =================================================
      // ANDROID
      // =================================================

      if (Capacitor.isNativePlatform()) {

        console.log(
          "1️⃣ Starting native Firebase Google login..."
        );

        const result =
          await FirebaseAuthentication.signInWithGoogle();

        console.log(
          "2️⃣ Firebase response:",
          result
        );

        const user =
          result?.user;

        if (!user) {
          throw new Error(
            "Firebase did not return a user."
          );
        }

        name =
          user.displayName ||
          "";

        email =
          user.email ||
          "";

        console.log(
          "3️⃣ Firebase user:",
          {
            name,
            email,
          }
        );

      }

      // =================================================
      // WEBSITE
      // =================================================

      else {

        console.log(
          "1️⃣ Starting web Firebase login..."
        );

        const {
          signInWithPopup,
        } = await import(
          "firebase/auth"
        );

        const {
          auth,
          provider,
        } = await import(
          "../utils/firebase"
        );

        const response =
          await signInWithPopup(
            auth,
            provider
          );

        console.log(
          "2️⃣ Web Firebase response:",
          response
        );

        const user =
          response?.user;

        if (!user) {
          throw new Error(
            "Firebase did not return a user."
          );
        }

        name =
          user.displayName ||
          "";

        email =
          user.email ||
          "";

        console.log(
          "3️⃣ Firebase user:",
          {
            name,
            email,
          }
        );
      }

      // =================================================
      // VALIDATE USER
      // =================================================

      if (!email) {
        throw new Error(
          "Google login succeeded, but email was not received."
        );
      }

      // =================================================
      // SEND TO BACKEND
      // =================================================

      console.log(
        "4️⃣ Sending Google user to backend..."
      );

      const response =
        await axios.post(
          `${ServerUrl}/api/auth/google`,
          {
            name,
            email,
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
        "5️⃣ Backend response:",
        response.data
      );

      // =================================================
      // GET USER
      // =================================================

      const user =
        response.data?.user ||
        response.data?.data ||
        response.data;

      if (!user || !user.email) {

        console.error(
          "Invalid backend user:",
          response.data
        );

        throw new Error(
          "Backend did not return valid user data."
        );
      }

      console.log(
        "6️⃣ Logged in user:",
        user
      );

      // =================================================
      // SAVE REDUX
      // =================================================

      dispatch(
        setUserData(user)
      );

      console.log(
        "7️⃣ User saved to Redux"
      );

      console.log(
        "✅ GOOGLE LOGIN SUCCESS"
      );

    } catch (error) {

      console.error(
        "❌ GOOGLE LOGIN ERROR"
      );

      console.error(
        error
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      console.error(
        "Status:",
        error?.response?.status
      );

      console.error(
        "Message:",
        error?.message
      );

      dispatch(
        setUserData(null)
      );

      setErrorMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Google login failed."
      );

    } finally {

      setLoading(false);

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
        initial={{
          opacity: 0,
          y: -40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
        className={`
          w-full
          ${
            isModel
              ? "max-w-md p-8 rounded-3xl"
              : "max-w-lg p-12 rounded-[32px]"
          }
          bg-white
          shadow-2xl
          border
          border-gray-200
        `}
      >

        {/* LOGO */}

        <div className="flex items-center justify-center gap-3 mb-6">

          <div className="bg-black text-white p-2 rounded-lg">

            <BsRobot size={18} />

          </div>

          <h2 className="font-semibold text-lg">
            InterviewIQ.AI
          </h2>

        </div>


        {/* HEADING */}

        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">

          Continue with

          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2 ml-2">

            <IoSparkles size={16} />

            AI Smart Interview

          </span>

        </h1>


        {/* DESCRIPTION */}

        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">

          Sign in to start AI-powered mock interviews,
          track your progress, and unlock detailed
          performance insights.

        </p>


        {/* ERROR */}

        {errorMessage && (

          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">

            {errorMessage}

          </div>

        )}


        {/* GOOGLE BUTTON */}

        <motion.button

          onClick={handleGoogleAuth}

          disabled={loading}

          whileHover={
            !loading
              ? {
                  opacity: 0.9,
                  scale: 1.03,
                }
              : undefined
          }

          whileTap={
            !loading
              ? {
                  scale: 0.98,
                }
              : undefined
          }

          className="
            w-full
            flex
            items-center
            justify-center
            gap-3
            py-3
            bg-black
            text-white
            rounded-full
            shadow-md
            disabled:bg-gray-500
            disabled:cursor-not-allowed
          "
        >

          {loading ? (

            <>
              <span className="animate-spin">
                ⏳
              </span>

              Signing in...

            </>

          ) : (

            <>
              <FcGoogle size={20} />

              Continue with Google
            </>

          )}

        </motion.button>

      </motion.div>

    </div>
  );
}

export default Auth;