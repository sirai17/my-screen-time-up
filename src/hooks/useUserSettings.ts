import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export interface UserSettings {
  goalMinutesPerDay: number;
  name?: string; // User's display name, can be synced from Auth
  iconURL?: string; // User's photo URL, can be synced from Auth
  autoShareTimeline: boolean;
  // Potentially add other user-specific settings here
  lastUpdated?: Timestamp;
}

export function useUserSettings() {
  const getUserSettings = async (
    userId: string
  ): Promise<UserSettings | null> => {
    if (!userId) {
      console.error("User ID is required to fetch settings.");
      return null;
    }
    const userDocRef = doc(db, "users", userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserSettings;
      } else {
        // Return default settings if no document exists,
        // or handle this as a "no settings found" case.
        // For now, returning null means no specific settings stored.
        console.log("No user settings document found for user:", userId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      return null;
    }
  };

  const updateUserSettings = async (
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<void> => {
    if (!userId) {
      console.error("User ID is required to update settings.");
      return;
    }
    const userDocRef = doc(db, "users", userId);
    try {
      await setDoc(userDocRef, { ...settings, lastUpdated: Timestamp.now() }, { merge: true });
      console.log("User settings updated successfully for user:", userId);
    } catch (error) {
      console.error("Error updating user settings:", error);
      // Consider re-throwing or providing more specific error feedback
      throw error; // Re-throw to be caught by the caller
    }
  };

  return {
    getUserSettings,
    updateUserSettings,
  };
}
