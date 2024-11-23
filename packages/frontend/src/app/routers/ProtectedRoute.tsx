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
          const userFetch = await axios.get("https://api.grk.pw/dis/user", {
            withCredentials: true,
          });
          const userServerFetch = await axios.get("https://api.grk.pw/dis/userServers", {
            withCredentials: true,
          });
          localStorage.setItem("user", JSON.stringify({ ...userFetch.data, timestamp: Date.now()}));
          const serverList = { selectedServer: { ...userServerFetch.data[0] }, serverList: [...userServerFetch.data] }
          localStorage.setItem("servers", JSON.stringify(serverList));
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