const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Uses project ID for token verification (no service account needed for verifyIdToken)
// For production, provide a service account JSON via FIREBASE_ADMIN_CREDENTIALS_PATH env var
if (!admin.apps?.length) {
  let config = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'baqala-fbbe4',
  };

  // 1. Try to use JSON string from environment variable (Best for Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      config.credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  } 
  // 2. Fallback to file path (Local development)
  else if (process.env.FIREBASE_ADMIN_CREDENTIALS_PATH) {
    try {
      const serviceAccount = require(process.env.FIREBASE_ADMIN_CREDENTIALS_PATH);
      config.credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error('Error loading FIREBASE_ADMIN_CREDENTIALS_PATH:', err.message);
    }
  }

  admin.initializeApp(config);
}

module.exports = admin;
