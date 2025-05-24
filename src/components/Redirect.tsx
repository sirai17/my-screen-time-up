import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLogs } from "../hooks/useLogs";

const Redirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signInAnonymously } = useAuth();
  const { addRedirectLog } = useLogs();

  const [statusMessage, setStatusMessage] = useState("Loading, please wait...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const targetUrl = searchParams.get("target");

    if (!targetUrl) {
      setError("Target URL is missing. Cannot redirect.");
      setStatusMessage("Error: Target URL missing.");
      return;
    }

    setStatusMessage(`Preparing to redirect to ${targetUrl}...`);

    const processRedirect = async () => {
      try {
        let currentUser = user;
        if (!currentUser && !authLoading) {
          setStatusMessage("No user found, attempting anonymous sign-in...");
          await signInAnonymously();
          // useAuth hook will update 'user' state, so we wait for next effect run
          return;
        }

        if (currentUser) {
          setStatusMessage("User identified, logging redirect...");
          const redirectLogId = await addRedirectLog(
            currentUser.uid,
            targetUrl
          );

          if (redirectLogId) {
            sessionStorage.setItem("redirectLogId", redirectLogId);
            setStatusMessage(`Redirecting to ${targetUrl}...`);
            window.location.href = targetUrl;
          } else {
            setError("Failed to log redirect. Cannot proceed.");
            setStatusMessage("Error: Failed to log redirect.");
          }
        } else if (authLoading) {
          setStatusMessage("Authenticating user...");
          // Wait for authLoading to complete, useEffect will re-run
        } else {
          // This case should ideally be handled by the anonymous sign-in attempt
          setError("User authentication failed. Cannot proceed.");
          setStatusMessage("Error: User authentication failed.");
        }
      } catch (err) {
        console.error("Error during redirect process:", err);
        let message = "An unexpected error occurred.";
        if (err instanceof Error) {
          message = err.message;
        }
        setError(`Redirect failed: ${message}`);
        setStatusMessage(`Error: ${message}`);
      }
    };

    // Trigger processRedirect only when authLoading is false.
    // If user is null initially, signInAnonymously is called,
    // then useAuth updates user, and this effect re-runs.
    if (!authLoading) {
      processRedirect();
    }
  }, [searchParams, user, authLoading, signInAnonymously, addRedirectLog]);

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        <h1>Redirect Error</h1>
        <p>{statusMessage}</p>
        <p>Details: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Redirecting...</h1>
      <p>{statusMessage}</p>
      {/* You could add a spinner here */}
    </div>
  );
};

export default Redirect;
