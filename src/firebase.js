
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIVf7f-4daWfuZDt4Ak80Ko7QoiFD94Do",
  authDomain: "tap-smart-card.firebaseapp.com",
  projectId: "tap-smart-card",
  storageBucket: "tap-smart-card.firebasestorage.app",
  messagingSenderId: "851070334746",
  appId: "1:851070334746:web:f9ddf5c6f7e719940a9ea3"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Record NFC card activity
export const logNfcActivity = async ({
  action,
  cardId,
  previousBusiness = '',
  newBusiness = '',
  details = ''
}) => {
  const admin = auth.currentUser

  await addDoc(collection(db, 'nfcCardActivity'), {
    action,
    cardId,
    previousBusiness,
    newBusiness,
    details,
    adminEmail: admin?.email || 'Unknown',
    adminUid: admin?.uid || '',
    createdAt: serverTimestamp()
  })
}

export default app
