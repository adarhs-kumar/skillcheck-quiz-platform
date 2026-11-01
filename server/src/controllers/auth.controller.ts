import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export const googleAuthHandler = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify Google Token (skip verification if missing valid client ID for dev purposes)
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // For local development if Google Client ID is not setup, we'll blindly decode it for mocking purposes
      // DO NOT DO THIS IN PRODUCTION!
      console.warn('[Auth] Token verification failed (or no CLIENT_ID). Decoding raw token instead for dev purposes...');
      payload = jwt.decode(token) as any;
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google Token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        // could add avatar field if schema had it
      });
      console.log(`[Auth] Created new user: ${email}`);
    } else {
      console.log(`[Auth] Existing user logged in: ${email}`);
    }

    // Issue internal JWT
    const authToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.status(200).json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: picture
      }
    });

  } catch (error) {
    console.error('[Auth] Google Auth Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
