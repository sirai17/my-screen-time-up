import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUserSettings, UserSettings } from "../hooks/useUserSettings";

const Settings: React.FC = () => {
  const {
    user,
    loading: authLoading,
    updateUserProfile,
    signOut,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();
  const { getUserSettings, updateUserSettings } = useUserSettings();

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [goalMinutes, setGoalMinutes] = useState(60); // Default goal
  const [autoShare, setAutoShare] = useState(true);

  // UI states
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch settings when user object is available
  useEffect(() => {
    if (user) {
      // Set initial form values from auth user object
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");

      // Fetch additional settings from Firestore
      setIsLoadingSettings(true);
      getUserSettings(user.uid)
        .then((settings) => {
          if (settings) {
            setGoalMinutes(settings.goalMinutesPerDay);
            setAutoShare(settings.autoShareTimeline);
            // If name/iconURL from Firestore are preferred, set them here
            // setDisplayName(settings.name || user.displayName || "");
            // setPhotoURL(settings.iconURL || user.photoURL || "");
          }
        })
        .catch((err) => {
          console.error("Error fetching user settings:", err);
          setError("Failed to load your settings.");
        })
        .finally(() => setIsLoadingSettings(false));
    } else {
      // Reset form if user logs out
      setDisplayName("");
      setPhotoURL("");
      setGoalMinutes(60);
      setAutoShare(true);
    }
  }, [user, getUserSettings]);

  const showFeedback = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    if (type === "success") {
      setSuccessMessage(message);
      setError(null);
    } else {
      setError(message);
      setSuccessMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 3000); // Clear message after 3 seconds
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(displayName, photoURL); // Update Firebase Auth profile
      await updateUserSettings(user.uid, { // Sync to Firestore 'users'
        name: displayName,
        iconURL: photoURL,
      });
      showFeedback("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      showFeedback("Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserSettings(user.uid, { goalMinutesPerDay: Number(goalMinutes) });
      showFeedback("Daily goal updated successfully!");
    } catch (err) {
      console.error("Error updating goal:", err);
      showFeedback("Failed to update daily goal.", "error");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAutoShareToggle = async (newAutoShareValue: boolean) => {
    setAutoShare(newAutoShareValue); // Optimistic update
    if (!user) return;
    setIsSaving(true); // Indicate saving for this specific action too
    try {
      await updateUserSettings(user.uid, { autoShareTimeline: newAutoShareValue });
      showFeedback("Auto-share preference updated!");
    } catch (err) {
      console.error("Error updating auto-share preference:", err);
      showFeedback("Failed to update auto-share preference.", "error");
      setAutoShare(!newAutoShareValue); // Revert optimistic update on error
    } finally {
      setIsSaving(false);
    }
  };


  if (authLoading || isLoadingSettings) {
    return <div className="p-4 text-center">Loading settings...</div>;
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">Please sign in to manage your settings.</p>
        {/* Optionally add sign-in buttons here if desired for a non-logged-in settings page view */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Settings</h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Profile Settings */}
      <form onSubmit={handleProfileUpdate} className="mb-8 p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700">Photo URL</label>
          <input
            type="text"
            id="photoURL"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            placeholder="https://example.com/image.png"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Goal Settings */}
      <form onSubmit={handleGoalUpdate} className="mb-8 p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Daily Goal</h2>
        <div className="mb-4">
          <label htmlFor="goalMinutes" className="block text-sm font-medium text-gray-700">Goal Minutes per Day</label>
          <input
            type="number"
            id="goalMinutes"
            value={goalMinutes}
            onChange={(e) => setGoalMinutes(Number(e.target.value))}
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
         <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Goal"}
        </button>
      </form>

      {/* Timeline Auto-Share */}
      <div className="mb-8 p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Timeline Sharing</h2>
        <div className="flex items-center">
          <input
            id="autoShare"
            name="autoShare"
            type="checkbox"
            checked={autoShare}
            onChange={(e) => handleAutoShareToggle(e.target.checked)}
            disabled={isSaving}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="autoShare" className="ml-2 block text-sm text-gray-900">
            Automatically share my results to the timeline when a day is completed.
          </label>
        </div>
      </div>
      
      {/* Authentication Options */}
      <div className="p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        {user.isAnonymous && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">Your account is currently anonymous. Link your account to save your progress across devices.</p>
            <button
              onClick={signInWithGoogle}
              disabled={isSaving}
              className="w-full mb-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Sign in with Google
            </button>
            <button
              onClick={signInWithApple}
              disabled={isSaving}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Sign in with Apple
            </button>
          </div>
        )}
        <button
          onClick={signOut}
          disabled={isSaving}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Settings;
