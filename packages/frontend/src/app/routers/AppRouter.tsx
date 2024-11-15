import "../styles/index.scss";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { BaseLayout } from "../layout";
import { Fallback } from "@/shared/ui";
import { LandingPage, LoginPage } from "@/pages";
import { Dashboard } from "@/features";
import { ProtectedRoute } from "./ProtectedRoute";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <BaseLayout />,
        errorElement: <Fallback />,
        children: [
          {
            path: "",
            element: <LandingPage />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    errorElement: <Fallback />,
    element: <LoginPage />,
  },
]);

export const AppRouter = () => {
  return (
    <div className="app">
      <div className="app__content">
        <RouterProvider router={router} />
      </div>
    </div>
  );
};
