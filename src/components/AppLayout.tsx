import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // To conditionally show links or user info

const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold hover:text-gray-300">
            TimeGuard
          </Link>
          <div className="space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Home
            </Link>
            <Link
              to="/history"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              History
            </Link>
            <Link
              to="/timeline"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Timeline
            </Link>
            <Link
              to="/settings"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Settings
            </Link>
            {user && (
              <button
                onClick={signOut}
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
              >
                Sign Out
              </button>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <Outlet /> {/* Child routes will be rendered here */}
      </main>
      <footer className="bg-gray-100 text-center p-4 text-sm text-gray-600 border-t">
        © {new Date().getFullYear()} TimeGuard Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default AppLayout;
