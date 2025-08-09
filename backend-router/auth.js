// auth.js

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Carga credenciales de Firebase desde variable de entorno o archivo
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON inválido:', e.message);
    process.exit(1);
  }
} else {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
  const absPath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);
  try {
    const fileContents = fs.readFileSync(absPath, 'utf8');
    serviceAccount = JSON.parse(fileContents);
  } catch (e) {
    console.error(`❌ No pude leer las credenciales de Firebase en "${absPath}".`);
    console.error('Asegúrate de que FIREBASE_SERVICE_ACCOUNT apunte al JSON correcto.');
    process.exit(1);
  }
}

// Inicializa la app de Firebase Admin si aún no está inicializada
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Middleware para verificar ID token de Firebase en el header Authorization.
 */
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.userId = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Token inválido',
      details: err.message
    });
  }
}
