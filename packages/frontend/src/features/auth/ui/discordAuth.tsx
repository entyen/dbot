import { useEffect, useState } from 'react';
import axios from 'axios';

export const DiscordLoginButton = () => {
  const handleLogin = () => {
    window.location.href = "https://api.grk.pw/dis/auth";
  };

  return (
    <button onClick={handleLogin}>
      Авторизоваться через Discord
    </button>
  );
};

export const Dashboard = () => {
  const [user, setUser] = useState({ username: null, id: null, global_name: null });

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get('https://api.grk.pw/dis/user', {
          withCredentials: true,
        });
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
      }
    }

    fetchUser();
  }, []);

  if (!user?.id) {
    return <div>Загрузка данных пользователя...</div>;
  }

  return (
    <div>
      <h1>Добро пожаловать, {user.global_name}</h1>
      <p>ID: {user.id}</p>
      <p>Дискорд: {user.username}</p>
    </div>
  );
};
