// server/database/firebaseAdmin.js
import dotenv from "dotenv";
import admin from "firebase-admin";

// load your .env right away
dotenv.config({
  path: "./database/.env",
});

const {
  FIREBASE_TYPE,
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_AUTH_URI,
  FIREBASE_TOKEN_URI,
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  FIREBASE_CLIENT_X509_CERT_URL,
  FIREBASE_UNIVERSE_DOMAIN,
} = process.env;

// sanity check
if (!FIREBASE_PRIVATE_KEY) {
  console.error("✖ Missing FIREBASE_PRIVATE_KEY in environment");
  process.exit(1);
}

const cert = {
  type: FIREBASE_TYPE,
  project_id: FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  // replace the literal “\n” sequences with actual newlines
  private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: FIREBASE_AUTH_URI,
  token_uri: FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: FIREBASE_UNIVERSE_DOMAIN,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(cert),
  });
}

export const verifyGoogleToken = async (req, res, next) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Google Token Verification Failed:", err);
    res.status(401).json({ message: err.message });
  }
};

export default admin;
