import "./historyPage.scss";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface HistoryItem {
  _id: string;
  serverId: string;
  giverId: string;
  getterId: string;
  givingPoints: number;
  givingReason: string;
}

export const HistoryPage = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<HistoryItem[] | null>(null); // Данные истории
  const [error, setError] = useState<string | null>(null); // Ошибка

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const servers = localStorage.getItem("servers");

        if (servers) {
          const parsedServers = JSON.parse(servers);

          if (parsedServers.selectedServer?.serverId) {
            const response = await axios.post(
              "https://api.grk.pw/dis/userHistoryFetch",
              {
                serverId: parsedServers.selectedServer.serverId,
              },
              { withCredentials: true }
            );

            if (response.data && response.data.length > 0) {
              setHistoryData(response.data); // Успешно получили данные
            } else {
              setHistoryData([]); // Данных нет
            }
          } else {
            setError("Некорректные данные пользователя или сервера.");
          }
        } else {
          setError("Данные отсутствуют в localStorage.");
        }
      } catch (error) {
        console.error("Ошибка при получении истории:", error);
        setError("Нет данных.");
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    navigate("/history");
  }, [navigate]);

  return (
    <section className="history-page">
      {error ? (
        <p className="error-message">{error}</p> // Ошибка
      ) : historyData === null ? (
        <p>Загрузка данных...</p> // Пока данные загружаются
      ) : historyData.length === 0 ? (
        <p>Нет данных</p> // Данные отсутствуют
      ) : (
        <div className="history-list">
          {historyData.map((item) => (
            <div className="history-card" key={item._id}>
              <h3 className="history-reason">{item.givingReason}</h3>
              <p>
                <strong>Очки:</strong>{" "}
                <span
                  className={
                    item.givingPoints > 0 ? "positive-points" : "negative-points"
                  }
                >
                  {item.givingPoints > 0 ? `+${item.givingPoints}` : item.givingPoints}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
