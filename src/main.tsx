import React from "react";
import ReactDOM from "react-dom";
import AppRoutes from "./routes";
import "./index.css"; // Assuming Tailwind CSS is set up via index.css
// If a global AuthProvider component was used, it would be imported and wrapped here.
// However, the current setup uses the useAuth hook directly in components,
// which relies on the Firebase SDK's global auth state.

ReactDOM.render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>,
  document.getElementById("root")
);
