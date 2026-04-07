const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Uses project ID for token verification (no service account needed for verifyIdToken)
// For production, provide a service account JSON via FIREBASE_ADMIN_CREDENTIALS_PATH env var
if (!admin.apps.length) {
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'baqala-fbbe4',
  };

  // If a service account path is provided, use it for full admin access
  if (process.env.FIREBASE_ADMIN_CREDENTIALS_PATH) {
    const serviceAccount = require(process.env.FIREBASE_ADMIN_CREDENTIALS_PATH);
    config.credential = admin.credential.cert(serviceAccount);
  }

  admin.initializeApp(config);
}

module.exports = admin;
