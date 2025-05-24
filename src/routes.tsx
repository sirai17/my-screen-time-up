import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./components/Home";
import Redirect from "./components/Redirect";
import History from "./components/History";
import Timeline from "./components/Timeline";
import Settings from "./components/Settings";

// A simple Not Found component
const NotFound: React.FC = () => (
  <div className="text-center p-8">
    <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="text-blue-500 hover:underline">Go to Homepage</Link> 
    {/* Added Link import below */}
  </div>
);
import { Link } from "react-router-dom"; // Added import for Link used in NotFound


const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone route for Redirect without AppLayout */}
        <Route path="/redirect" element={<Redirect />} />

        {/* Routes with AppLayout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} /> {/* Default child for / */}
          <Route path="history" element={<History />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all route */}
        {/* Option 1: Navigate to home */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        {/* Option 2: Show a Not Found component (potentially within AppLayout or standalone) */}
        {/* For a NotFound within AppLayout: */}
        <Route path="*" element={<AppLayout />}>
             <Route path="*" element={<NotFound />} />
        </Route>
        {/* For a standalone NotFound: <Route path="*" element={<NotFound />} /> */}

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
