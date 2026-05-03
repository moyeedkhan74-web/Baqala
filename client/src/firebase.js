import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, get, push, update, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";

// Baqala Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxVV1JGrYn0-cou_yZuP7-66Oz1qtqDOk",
  authDomain: "baqala-fbbe4.firebaseapp.com",
  databaseURL: "https://baqala-fbbe4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "baqala-fbbe4",
  storageBucket: "baqala-fbbe4.firebasestorage.app",
  messagingSenderId: "852997400807",
  appId: "1:852997400807:web:bea3406aafd306f4fa1a42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Helper: Google Sign-In via popup
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Helper: Email/Password Sign-In
export const firebaseEmailLogin = (email, password) => signInWithEmailAndPassword(auth, email, password);

// Helper: Email/Password Sign-Up
export const firebaseEmailRegister = (email, password) => createUserWithEmailAndPassword(auth, email, password);

// Helper: Sign Out
export const firebaseSignOut = () => signOut(auth);

// Helper: Get current user's Firebase ID token
export const getFirebaseIdToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(true);
  }
  return null;
};

// Firebase Realtime Database helpers
export const dbRef = (path) => ref(database, path);

export const writeData = async (path, data) => {
  try {
    await set(ref(database, path), data);
    return { success: true };
  } catch (error) {
    console.error('Error writing to database:', error);
    return { success: false, error };
  }
};

export const readData = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error reading from database:', error);
    return null;
  }
};

export const pushData = async (path, data) => {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, data);
    return { success: true, key: newRef.key };
  } catch (error) {
    console.error('Error pushing to database:', error);
    return { success: false, error };
  }
};

export const updateData = async (path, data) => {
  try {
    await update(ref(database, path), data);
    return { success: true };
  } catch (error) {
    console.error('Error updating database:', error);
    return { success: false, error };
  }
};

export const deleteData = async (path) => {
  try {
    await remove(ref(database, path));
    return { success: true };
  } catch (error) {
    console.error('Error deleting from database:', error);
    return { success: false, error };
  }
};

// Firebase Storage helpers
export const uploadFile = async (path, file) => {
  try {
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL, path: snapshot.ref.fullPath };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error };
  }
};

export const uploadFileWithProgress = (path, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const fileRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      }, 
      (error) => {
        console.error('Error uploading file resumable:', error);
        resolve({ success: false, error }); // Resolve false on error to mimic original behavior
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ success: true, url: downloadURL, path: uploadTask.snapshot.ref.fullPath });
        } catch (error) {
          resolve({ success: false, error });
        }
      }
    );
  });
};


export const deleteFile = async (path) => {
  try {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error };
  }
};

export { app, auth, database, storage, googleProvider };
