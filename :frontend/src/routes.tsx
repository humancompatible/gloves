import { createBrowserRouter } from "react-router-dom"
import NotFound from "./not-found";
import GlanceLayout from "./app/Tasks/GlanceTask/GlanceLayout";

const routes = createBrowserRouter([
 
  {
    path: "/",
    element: <GlanceLayout />,
    errorElement: <NotFound />
  },
  // {
  //   path: "/login",
  //   element: <Login />,
  //   errorElement: <ErrorPage />,
  // },
]);

export default routes;



