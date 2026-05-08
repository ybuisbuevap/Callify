// import axios from "axios";
// import httpStatus from "http-status";
// import { createContext, useContext, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import server from "../environment";


// export const AuthContext = createContext({});

// const client = axios.create({
//     baseURL: `${server}/api/v1/users`
// })


// export const AuthProvider = ({ children }) => {

//     const authContext = useContext(AuthContext);


//     const [userData, setUserData] = useState(authContext);


//     const router = useNavigate();

//     const handleRegister = async (name, username, email, password) => {
//         console.log("REGISTER FUNCTION CALLED");
//         try {
//             let request = await client.post("/register", {
//                 name: name,
//                 username: username,
//                 email: email,
//                 password: password
//             })


//             if (request.status === httpStatus.CREATED) {
//                 return request.data.message;
//             }
//         } catch (err) {
//             throw err;
//         }
//     }

//     const handleLogin = async (username, password) => {
//     console.log("LOGIN FUNCTION CALLED", username, password);   
//     try {
//         let request = await client.post("/login", {
//             username: username,
//             password: password
//         });

//         console.log("LOGIN RESPONSE:", request.data); // 🔥 DEBUG

//         if (request.status === 200) {
//             const token = request.data.token;

//             console.log("TOKEN FROM BACKEND:", token); // 🔥 DEBUG

//             localStorage.setItem("token", token);

//             console.log("TOKEN SAVED:", localStorage.getItem("token")); // 🔥 DEBUG

//             router("/home");
//         }
//     } catch (err) {
//         console.log("LOGIN ERROR:", err);
//         throw err;
//     }
// };

//     const getHistoryOfUser = async () => {
//         try {
//             let request = await client.get("/history", {
//                 headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") }`      
//             }
//             });
//             return request.data
//         } catch
//          (err) {
//             throw err;
//         }
//     }

//     const addToUserHistory = async (meetingCode) => {
//         try {
//             let request = await client.post("/history",
// {
//     meeting_code: meetingCode
// },
// {
//     headers: {
//         Authorization: `Bearer ${localStorage.getItem("token") }`      
//     }
// });
//             return request
//         } catch (e) {
//             throw e;
//         }
//     }


//     const data = {
//         userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
//     }

//     return (
//         <AuthContext.Provider value={data}>
//             {children}
//         </AuthContext.Provider>
//     )

// }

import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
});

export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);
    const router = useNavigate();

    const handleRegister = async (name, username, email, password) => {
        try {
            let request = await client.post("/register", { name, username, email, password });
            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", { username, password });
            if (request.status === 200) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (err) {
            throw err;
        }
    };

    const handleResendVerification = async (email) => {
        try {
            let request = await client.post("/resend-verification", { email });
            return request.data.message;
        } catch (err) {
            throw err;
        }
    };

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/history", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return request.data;
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/history",
                { meeting_code: meetingCode },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            return request;
        } catch (e) {
            throw e;
        }
    };

    const handleUpdateProfile = async (name, username) => {
    try {
        const request = await client.put("/profile",
            { name, username },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return request.data;
    } catch (err) {
        throw err;
    }
};

    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser,
        handleRegister, handleLogin, handleResendVerification, handleUpdateProfile
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};