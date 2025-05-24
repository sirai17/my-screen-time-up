import {
  Auth,
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut, // Renamed to avoid conflict
  updateProfile, // Import updateProfile
} from "firebase/auth";
import { auth } from "../firebase"; // Assuming auth is exported from firebase.ts
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error appropriately in a real application
    }
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider("apple.com");
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Apple:", error);
      // Handle error appropriately in a real application
    }
  };

  const signInAnonymouslyFirebase = async () => { // Renamed to avoid conflict
    try {
      await signInAnonymously(auth);
    } catch (error) { // Added curly braces
      console.error("Error signing in anonymously:", error);
      // Handle error appropriately in a real application
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle error appropriately in a real application
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signInAnonymously: signInAnonymouslyFirebase, // Export with the desired name
    signOut,
    updateUserProfile, // Export updateUserProfile
  };
}

// Helper function to update user profile
const updateUserProfile = async (displayName?: string, photoURL?: string) => {
  if (!auth.currentUser) {
    throw new Error("User not authenticated to update profile.");
  }
  try {
    await updateProfile(auth.currentUser, {
      displayName: displayName ?? auth.currentUser.displayName, // Keep current if undefined
      photoURL: photoURL ?? auth.currentUser.photoURL,       // Keep current if undefined
    });
    // The onAuthStateChanged listener in useAuth should pick up the updated user automatically.
    // If not, manual refresh of user state might be needed, but typically not.
    console.log("User profile updated successfully.");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error; // Re-throw to be handled by the caller
  }
};
