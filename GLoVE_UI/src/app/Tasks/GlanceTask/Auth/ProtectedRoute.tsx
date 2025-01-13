
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("token"); // Replace with actual auth logic
  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default ProtectedRoute;
