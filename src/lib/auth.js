// lib/auth.js
//
// This module verifies JWT tokens stored in cookies.
// It's used by every protected API route to check if the user is logged in.

import jwt from 'jsonwebtoken';

export function verifyToken(req) {
    // Cookies come in as a single semicolon-separated string in the Cookie header
    const cookies = req.headers.cookie;

    if (!cookies) {
        // No cookies at all means the user isn't logged in
        return null;
    }

    // Split the cookie string and find the one named "token"
    const tokenMatch = cookies.split(';').find(c => c.trim().startsWith('token='));

    if (!tokenMatch) {
        // The "token" cookie isn't present
        return null;
    }

    // Extract the actual token value from "token=xyz"
    const token = tokenMatch.split('=')[1];

    try {
        // Verify the JWT signature and check if it's expired.
        // If valid, jwt.verify returns the decoded payload (username, role, etc.)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        // The token is either invalid, expired, or signed with a different secret.
        // We intentionally don't log here because this is a normal case when
        // a token expires — not an error worth filling logs with.
        return null;
    }
}
