import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://callify-backend-709m.onrender.com/api/v1/users/auth/google/callback"
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