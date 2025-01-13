import { createBrowserRouter } from "react-router-dom"
import ErrorPage from "./error-page";
import NotFound from "./not-found";
import GlanceComponent from "./app/Tasks/GlanceTask/GlanceComponent";
import ProtectedRoute from "./app/Tasks/GlanceTask/Auth/ProtectedRoute";
import Login from "./app/Tasks/GlanceTask/Auth/Login";

const routes = createBrowserRouter([
 
  {
    path: "/",
    element: <GlanceComponent />,
    errorElement: <NotFound />
  },
  // {
  //   path: "/login",
  //   element: <Login />,
  //   errorElement: <ErrorPage />,
  // },
]);

export default routes;



