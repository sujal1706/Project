import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { ServerUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import AuthModel from "./AuthModel";

function Navbar() {
  const { userData } = useSelector(
    (state) => state.user
  );

  const [showCreditPopup, setShowCreditPopup] =
    useState(false);

  const [showUserPopup, setShowUserPopup] =
    useState(false);

  const [showAuth, setShowAuth] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Safe user values
  const userName = userData?.name || "";
  const userCredits = userData?.credits ?? 0;

  // Safe first letter
  const userInitial = userName
    ? userName.charAt(0).toUpperCase()
    : null;

  const handleLogout = async () => {
    try {
      console.log("Logging out...");

      await axios.get(
        `${ServerUrl}/api/auth/logout`,
        {
          withCredentials: true,
        }
      );

      dispatch(setUserData(null));

      setShowCreditPopup(false);
      setShowUserPopup(false);

      navigate("/");

      console.log("Logout successful");

    } catch (error) {
      console.error("Logout error:", error);

      // Even if backend logout fails,
      // clear frontend login state.
      dispatch(setUserData(null));

      setShowCreditPopup(false);
      setShowUserPopup(false);

      navigate("/");
    }
  };

  const handleUserClick = () => {
    if (!userData) {
      setShowAuth(true);
      return;
    }

    setShowUserPopup((prev) => !prev);
    setShowCreditPopup(false);
  };

  const handleCreditClick = () => {
    if (!userData) {
      setShowAuth(true);
      return;
    }

    setShowCreditPopup((prev) => !prev);
    setShowUserPopup(false);
  };

  return (
    <div className="bg-[#f3f3f3] flex justify-center px-4 pt-6">

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
          duration: 0.3,
        }}
        className="
          w-full
          max-w-6xl
          bg-white
          rounded-[24px]
          shadow-sm
          border
          border-gray-200
          px-8
          py-4
          flex
          justify-between
          items-center
          relative
        "
      >

        {/* =========================
            LOGO
        ========================== */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer"
        >

          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <h1 className="font-semibold hidden md:block text-lg">
            InterviewIQ.AI
          </h1>

        </div>


        {/* =========================
            RIGHT SIDE
        ========================== */}
        <div className="flex items-center gap-6 relative">

          {/* =========================
              CREDITS
          ========================== */}
          <div className="relative">

            <button
              onClick={handleCreditClick}
              className="
                flex
                items-center
                gap-2
                bg-gray-100
                px-4
                py-2
                rounded-full
                text-md
                hover:bg-gray-200
                transition
              "
            >

              <BsCoin size={20} />

              <span>
                {userCredits}
              </span>

            </button>


            {showCreditPopup && (
              <div
                className="
                  absolute
                  right-[-50px]
                  mt-3
                  w-64
                  bg-white
                  shadow-xl
                  border
                  border-gray-200
                  rounded-xl
                  p-5
                  z-50
                "
              >

                <p className="text-sm text-gray-600 mb-4">
                  Need more credits to continue interviews?
                </p>

                <button
                  onClick={() => navigate("/pricing")}
                  className="
                    w-full
                    bg-black
                    text-white
                    py-2
                    rounded-lg
                    text-sm
                  "
                >
                  Buy more credits
                </button>

              </div>
            )}

          </div>


          {/* =========================
              USER
          ========================== */}
          <div className="relative">

            <button
              onClick={handleUserClick}
              className="
                w-9
                h-9
                bg-black
                text-white
                rounded-full
                flex
                items-center
                justify-center
                font-semibold
              "
            >

              {userInitial ? (
                userInitial
              ) : (
                <FaUserAstronaut size={16} />
              )}

            </button>


            {/* =========================
                USER MENU
            ========================== */}
            {showUserPopup && userData && (
              <div
                className="
                  absolute
                  right-0
                  mt-3
                  w-56
                  bg-white
                  shadow-xl
                  border
                  border-gray-200
                  rounded-xl
                  p-4
                  z-50
                "
              >

                <p className="text-md text-blue-500 font-medium mb-1">
                  {userName || "User"}
                </p>

                {userData?.email && (
                  <p className="text-xs text-gray-400 mb-3 truncate">
                    {userData.email}
                  </p>
                )}

                <button
                  onClick={() => {
                    setShowUserPopup(false);
                    navigate("/history");
                  }}
                  className="
                    w-full
                    text-left
                    text-sm
                    py-2
                    hover:text-black
                    text-gray-600
                  "
                >
                  Interview History
                </button>


                <button
                  onClick={handleLogout}
                  className="
                    w-full
                    text-left
                    text-sm
                    py-2
                    flex
                    items-center
                    gap-2
                    text-red-500
                  "
                >
                  <HiOutlineLogout size={16} />

                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

      </motion.div>


      {/* =========================
          AUTH MODAL
      ========================== */}
      {showAuth && (
        <AuthModel
          onClose={() => setShowAuth(false)}
        />
      )}

    </div>
  );
}

export default Navbar;