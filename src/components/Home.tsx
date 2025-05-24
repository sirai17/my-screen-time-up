import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLogs, DailyLog } from "../hooks/useLogs"; // Import DailyLog interface
import WarningModal from "./WarningModal"; // Import WarningModal

const DEFAULT_GOAL_MINUTES = 60;

const Home: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { addRedirectLog, updateRedirectLogAndCreateDailyLog, getDailyLog } =
    useLogs();

  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentGoalMinutes, setCurrentGoalMinutes] = useState(DEFAULT_GOAL_MINUTES);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false); // State for WarningModal

  const fetchDailyLogData = useCallback(async () => {
    if (user) {
      setIsLoadingLog(true);
      setError(null);
      try {
        const log = await getDailyLog(user.uid);
        setDailyLog(log);
        if (log && log.goalMinutes) {
          setCurrentGoalMinutes(log.goalMinutes);
        } else {
          setCurrentGoalMinutes(DEFAULT_GOAL_MINUTES);
        }
        // Check if warning modal should be shown
        if (log && !log.achieved) { // !achieved means totalUsage > goal
          const hasModalBeenShownToday = sessionStorage.getItem(`warningModalShown_${log.date}`);
          if (!hasModalBeenShownToday) {
            setIsWarningModalOpen(true);
            sessionStorage.setItem(`warningModalShown_${log.date}`, "true");
          }
        }
      } catch (e) {
        console.error("Error fetching daily log:", e);
        setError("Failed to load daily statistics.");
      } finally {
        setIsLoadingLog(false);
      }
    } else {
      setDailyLog(null); // Clear log if no user
    }
  }, [user, getDailyLog]);

  useEffect(() => {
    fetchDailyLogData();
  }, [fetchDailyLogData]);

  useEffect(() => {
    // Check session storage on mount to see if a session was already active
    const activeLogId = sessionStorage.getItem("redirectLogId");
    if (activeLogId) {
      setIsSessionActive(true);
    }
  }, []);

  const handleStartSession = async () => {
    if (!user) {
      setError("You must be logged in to start a session.");
      return;
    }
    if (sessionStorage.getItem("redirectLogId")) {
        setError("A session is already active. End the current session first or refresh.");
        setIsSessionActive(true); // Sync state if session storage has item
        return;
    }
    try {
      const redirectLogId = await addRedirectLog(
        user.uid,
        "manual_test_session"
      );
      if (redirectLogId) {
        sessionStorage.setItem("redirectLogId", redirectLogId);
        setIsSessionActive(true);
        setError(null); // Clear previous errors
      } else {
        setError("Failed to start session.");
      }
    } catch (e) {
      console.error("Error starting session:", e);
      setError("Failed to start session.");
    }
  };

  const handleEndSession = async () => {
    if (!user) {
      setError("User not found. Cannot end session.");
      return;
    }
    const redirectLogId = sessionStorage.getItem("redirectLogId");
    if (!redirectLogId) {
      setError("No active session found to end.");
      setIsSessionActive(false); // Sync state
      return;
    }

    try {
      // Use currentGoalMinutes which is sourced from dailyLog or default
      await updateRedirectLogAndCreateDailyLog(
        redirectLogId,
        user.uid,
        currentGoalMinutes
      );
      sessionStorage.removeItem("redirectLogId");
      setIsSessionActive(false);
      setError(null); // Clear previous errors
      fetchDailyLogData(); // Refresh daily log data
    } catch (e) {
      console.error("Error ending session:", e);
      setError("Failed to end session.");
    }
  };

  if (authLoading) {
    return <p>Authenticating...</p>;
  }

  if (!user) {
    return <p>Please sign in to view your dashboard and manage sessions.</p>;
  }

  const totalUsageMinutes = dailyLog?.totalDurationMinutes || 0;
  const goalAchieved = dailyLog ? dailyLog.achieved : totalUsageMinutes <= currentGoalMinutes;


  return (
    <div style={{ padding: "20px" }}>
      <h1>Home Dashboard</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div>
        <h2>Today's Stats</h2>
        {isLoadingLog ? (
          <p>Loading daily stats...</p>
        ) : (
          <>
            <p>
              Usage: {totalUsageMinutes} / {currentGoalMinutes} minutes
            </p>
            <p>
              Status: {goalAchieved ? (
                <span role="img" aria-label="goal achieved">
                  🔥 Achieved!
                </span>
              ) : (
                <span role="img" aria-label="goal not achieved">
                  💥 Over Limit!
                </span>
              )}
            </p>
          </>
        )}
      </div>

      <div>
        <h2>Manual Session Control</h2>
        {isSessionActive ? (
          <button onClick={handleEndSession}>End Session</button>
        ) : (
          <button onClick={handleStartSession}>Start Session</button>
        )}
      </div>
      <p style={{marginTop: "10px", fontSize:"0.8em", color:"gray"}}>
        Note: Manual session is for testing. Redirections from browser extension will be logged automatically.
      </p>
      <WarningModal 
        isOpen={isWarningModalOpen} 
        onClose={() => setIsWarningModalOpen(false)} 
      />
    </div>
  );
};

export default Home;
