const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download this from Firebase console > Project Settings > Service Accounts > Generate new private key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setWhitelistedClaim(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'whitelisted' });
    console.log(`Custom claim set for user: ${uid}`);
  } catch (error) {
    console.error('Error setting custom claim:', error);
  }
}

// Replace with your user's UID (from Firebase console > Authentication > Users)
const userUid = 'Sf9gxSgy9HO17xzDfttucvbVW3w2';
setWhitelistedClaim(userUid);
