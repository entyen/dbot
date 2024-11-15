import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";

export const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      const user = localStorage.getItem("user");
      if (!user) {
        try {
          const response = await axios.get("https://api.grk.pw/dis/user", {
            withCredentials: true,
          });
          localStorage.setItem("user", JSON.stringify(response.data));
          setIsAuthenticated(true); // Пользователь успешно аутентифицирован
        } catch (error) {
          console.error("Ошибка проверки аутентификации:", error);
          setIsAuthenticated(false); // Пользователь не аутентифицирован
        }
      } else {
        setIsAuthenticated(true); // Пользователь уже аутентифицирован
      }
    };

    checkAuthentication();
  }, []);

  if (isAuthenticated === null) {
    // Пока идет проверка аутентификации
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    // Если пользователь не аутентифицирован, перенаправляем на /login
    return <Navigate to="/login" replace />;
  }

  // Если аутентифицирован, рендерим вложенные маршруты
  return <Outlet />;
};