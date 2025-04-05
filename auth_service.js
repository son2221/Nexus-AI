import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import firebaseConfig from './firebase_config.js';
import { showNotification } from './script_utils.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Event callbacks
let onAuthStateChangedCallback = null;

// Listen for auth state changes
export function setupAuthListener(callback) {
  onAuthStateChangedCallback = callback;
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Enhanced user object with additional Google profile details
      const enhancedUser = await enrichGoogleUserProfile(user);
      if (callback && typeof callback === 'function') {
        callback(enhancedUser);
      }
    } else {
      if (callback && typeof callback === 'function') {
        callback(null);
      }
    }
  });
}

// Enrich Google user profile with additional details
async function enrichGoogleUserProfile(user) {
  // Base user details from Firebase
  const enrichedUser = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    profileImage: user.photoURL || null,
    
    // Additional Google profile information
    googleProviderData: null
  };

  // Add Google provider specific data if available
  const googleProviderData = user.providerData.find(
    provider => provider.providerId === 'google.com'
  );

  if (googleProviderData) {
    enrichedUser.googleProviderData = {
      displayName: googleProviderData.displayName,
      email: googleProviderData.email,
      phoneNumber: googleProviderData.phoneNumber,
      photoURL: googleProviderData.photoURL
    };
  }

  return enrichedUser;
}

// Sign up with email and password
export async function signUpWithEmail(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with name
    await updateProfile(userCredential.user, { 
      displayName: name 
    });
    
    showNotification('Account created successfully!', 'success');
    return { user: userCredential.user, userData: { name } };
  } catch (error) {
    showNotification(getErrorMessage(error), 'error');
    throw error;
  }
}

// Sign in with email and password
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showNotification('Logged in successfully!', 'success');
    return userCredential.user;
  } catch (error) {
    showNotification(getErrorMessage(error), 'error');
    throw error;
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Update profile with Google account details
    if (result.user) {
      await updateProfile(result.user, {
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
    }
    
    showNotification('Logged in with Google successfully!', 'success');
    return result.user;
  } catch (error) {
    showNotification(getErrorMessage(error), 'error');
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(updates) {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updateProfile(currentUser, updates);
      showNotification('Profile updated successfully!', 'success');
      return currentUser;
    } else {
      throw new Error('No user is currently signed in');
    }
  } catch (error) {
    showNotification(getErrorMessage(error), 'error');
    throw error;
  }
}

// Sign out
export async function logoutUser() {
  try {
    await signOut(auth);
    showNotification('Logged out successfully', 'info');
    return true;
  } catch (error) {
    showNotification('Error logging out', 'error');
    throw error;
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Helper to get user-friendly error messages
function getErrorMessage(error) {
  const errorCodeMap = {
    'auth/email-already-in-use': 'Email address is already in use',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'User account has been disabled',
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/weak-password': 'Password is too weak',
    'auth/popup-closed-by-user': 'Authentication cancelled',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations'
  };

  return errorCodeMap[error.code] || error.message || 'An unknown error occurred';
}