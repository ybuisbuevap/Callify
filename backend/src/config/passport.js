import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // This needs to be the Vercel-proxied path (https://<your-app>.vercel.app/api/v1/users/auth/google/callback),
    // not the direct Render URL — otherwise the cookie set on this response
    // ends up scoped to Render's domain, making it a cross-site cookie again
    // even with the proxy in place for everything else.
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // user exists — mark as verified and return
            user.isVerified = true;
            await user.save();
            return done(null, user);
        }

        // create new user from Google profile
        const newUser = new User({
            name: profile.displayName,
            username: profile.emails[0].value.split("@")[0], // use email prefix as username
            email: profile.emails[0].value,
            authProvider: "google",
            isVerified: true // Google already verified the email
        });

        await newUser.save();
        return done(null, newUser);

    } catch (err) {
        return done(err, null);
    }
}));

export default passport;