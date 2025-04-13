import { OAuth2Client, TokenPayload } from 'google-auth-library';
import pool from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT
);

export async function getGoogleAuthUrl(): Promise<string> {
  return client.generateAuthUrl({
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(code: string): Promise<User> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload() as TokenPayload;

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name;

  if (!email) {
    throw new Error('No email provided by Google');
  }

  // Tìm social_account
  const [socialRows] = await pool.query(
    'SELECT * FROM social_accounts WHERE provider_name = ? AND provider_id = ?',
    ['google', googleId]
  );
  const socialAccount = (socialRows as any[])[0];

  let user: User;

  if (socialAccount) {
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      socialAccount.user_id,
    ]);
    user = (userRows as any[])[0] as User;
  } else {
    const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    user = (userRows as any[])[0] as User;

    if (!user) {
      const userId = uuidv4();
      await pool.query(
        'INSERT INTO users (id, name, email, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
        [userId, name || 'Unknown', email]
      );
      const [newUserRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = (newUserRows as any[])[0] as User;
    }

    const socialId = uuidv4();
    await pool.query(
      'INSERT INTO social_accounts (id, user_id, provider_name, provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [socialId, user.id, 'google', googleId]
    );
  }

  return user;
}