import "../styles/index.scss";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { HomeLayout } from "../layout";
import { Fallback } from "@/shared/ui";
import { HistoryPage, HomePage, LoginPage } from "@/pages";
import { Dashboard } from "@/features";
import { ProtectedRoute } from "./ProtectedRoute";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    errorElement: <Fallback />,
    children: [
      {
        path: "/",
        element: <HomeLayout />,
        errorElement: <Fallback />,
        children: [
          {
            path: "",
            element: <HomePage />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "history",
            element: <HistoryPage />,
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
