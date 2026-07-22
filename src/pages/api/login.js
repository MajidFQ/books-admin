// pages/api/login.js
//
// This is the login endpoint. It receives a username and password,
// checks them against the values stored in environment variables,
// and if they match, issues a signed JWT stored in an HttpOnly cookie.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Only POST requests make sense here — reject everything else early
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, password } = req.body;

    // Catch missing fields before doing any real work
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
    }

    try {
        // Check username first. We return the same vague "Invalid credentials"
        // message for both a wrong username and a wrong password on purpose —
        // giving different messages would let an attacker enumerate valid usernames.
        if (username !== process.env.ADMIN_USERNAME) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // bcrypt.compareSync hashes the plain-text password and compares it to
        // the stored hash. We never store the raw password anywhere.
        const passwordMatches = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Credentials are valid — create a JWT.
        // The payload carries the username and role so any route that verifies
        // this token knows who the user is without hitting the database again.
        // We expire it in 2 hours so a stolen token can't be used forever.
        const token = jwt.sign(
            { username: username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Store the token in a cookie rather than returning it in the response body.
        // HttpOnly means JavaScript running in the browser can't read it,
        // which protects against XSS attacks stealing the token.
        // SameSite=Strict prevents it from being sent on cross-site requests (CSRF protection).
        // Secure is added only in production so HTTPS is required there, but local dev still works.
        const maxAge = 60 * 60 * 2; // 2 hours in seconds — must match the JWT expiry above
        const isProduction = process.env.NODE_ENV === 'production';

        const cookieString = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${
            isProduction ? '; Secure' : ''
        }`;

        res.setHeader('Set-Cookie', cookieString);
        return res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        // Something unexpected happened (e.g. JWT_SECRET is missing).
        // Log the real error on the server so we can debug it,
        // but don't send internal details back to the client.
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
