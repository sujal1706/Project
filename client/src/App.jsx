import React, {
    useEffect,
} from "react";

import {
    Route,
    Routes,
} from "react-router-dom";

import axios from "axios";

import {
    useDispatch,
} from "react-redux";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import InterviewPage from "./pages/InterviewPage";
import InterviewHistory from "./pages/InterviewHistory";
import Pricing from "./pages/Pricing";
import InterviewReport from "./pages/InterviewReport";

import {
    setUserData,
} from "./redux/userSlice";

import {
    ServerUrl,
} from "./config";

export { ServerUrl };


function App() {

    const dispatch = useDispatch();


    useEffect(() => {

        const getUser = async () => {

            try {

                if (!ServerUrl) {

                    console.error(
                        "❌ Backend URL missing"
                    );

                    dispatch(
                        setUserData(null)
                    );

                    return;
                }


                // ==================================================
                // GET ANDROID TOKEN
                // ==================================================

                const nativeToken =
                    localStorage.getItem(
                        "authToken"
                    );


                const headers = {};


                if (nativeToken) {

                    headers.Authorization =
                        `Bearer ${nativeToken}`;

                }


                console.log(
                    "Checking current user:",
                    `${ServerUrl}/api/user/current-user`
                );


                const result =
                    await axios.get(
                        `${ServerUrl}/api/user/current-user`,
                        {
                            withCredentials: true,

                            headers,
                        }
                    );


                console.log(
                    "Current user response:",
                    result.data
                );


                const user =
                    result.data?.user ||
                    result.data;


                if (
                    user &&
                    user.email
                ) {

                    dispatch(
                        setUserData(user)
                    );

                    console.log(
                        "✅ User loaded:",
                        user
                    );

                } else {

                    dispatch(
                        setUserData(null)
                    );

                }

            } catch (error) {

                console.error(
                    "❌ Current User Error:",
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


                dispatch(
                    setUserData(null)
                );
            }
        };


        getUser();

    }, [dispatch]);


    return (
        <Routes>

            <Route
                path="/"
                element={<Home />}
            />

            <Route
                path="/auth"
                element={<Auth />}
            />

            <Route
                path="/interview"
                element={<InterviewPage />}
            />

            <Route
                path="/history"
                element={<InterviewHistory />}
            />

            <Route
                path="/pricing"
                element={<Pricing />}
            />

            <Route
                path="/report/:id"
                element={<InterviewReport />}
            />

        </Routes>
    );
}


export default App;