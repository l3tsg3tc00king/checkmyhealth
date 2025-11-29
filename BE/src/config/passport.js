// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/user.model');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
            proxy: true // QUAN TRỌNG: Cho Render/production
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Tìm hoặc tạo user từ Google profile
                const user = await userModel.findOrCreateGoogleUser(profile);
                return done(null, user);
            } catch (error) {
                console.error('Google Strategy Error:', error);
                return done(error, null);
            }
        }
    )
);

module.exports = passport;