import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import axios from "axios";
import server from "../environment";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const [checking, setChecking] = useState(true);

        useEffect(() => {
            // The JWT lives in an httpOnly cookie now, so JS can't read it
            // directly to check "is the user logged in" the way a
            // localStorage check could. Instead, ask the server — it'll
            // 401 if there's no valid cookie.
            axios.get(`${server}/api/v1/users/me`)
                .then(() => setChecking(false))
                .catch(() => router("/auth"));
        }, [])

        if (checking) return <div className="page-loading">Loading...</div>;

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;