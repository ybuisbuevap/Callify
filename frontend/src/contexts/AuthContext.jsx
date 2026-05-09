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