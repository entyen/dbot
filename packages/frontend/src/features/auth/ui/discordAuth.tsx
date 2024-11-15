import { useEffect, useState } from "react";
import "./discordAuth.scss";

interface User {
  id: string;
  global_name: string;
  username: string;
}

export const DiscordLoginButton = () => {
  const handleLogin = () => {
    window.location.href = "https://api.grk.pw/dis/auth";
  };

  return (
    <button className="DiscordLoginButton" onClick={handleLogin}>
      Авторизоваться через Discord
    </button>
  );
};

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);

  // Загружаем пользователя из localStorage
  const loadUserFromLocalStorage = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Загружаем данные при первом рендере
    loadUserFromLocalStorage();

    // Обновляем данные, если localStorage изменяется
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        loadUserFromLocalStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Принудительное обновление после записи в localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      loadUserFromLocalStorage();
    }, 500);

    return () => clearInterval(interval); // Очищаем таймер
  }, []);

  if (!user) {
    return <div>Загрузка данных пользователя...</div>;
  }

  return (
    <div>
      <h1>Добро пожаловать, {user.global_name}</h1>
      <p>Дискорд: {user.username}</p>
    </div>
  );
};
