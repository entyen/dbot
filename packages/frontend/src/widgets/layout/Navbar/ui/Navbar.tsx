import { useState, useEffect } from "react";
import "./navbar.scss";
import clsx from "clsx";
import { LogoIcon } from "@/shared/assets";

interface Server {
  selectedServer: {
    serverId: string;
    serverName: string;
  };
  serverList: {
    serverId: string;
    serverName: string;
  }[];
}

export const Navbar = () => {
  const [serverData, setServerData] = useState<Server>({
    selectedServer: { serverId: "", serverName: "" },
    serverList: [],
  });

  useEffect(() => {
    const storedServerData = localStorage.getItem("servers");
    if (storedServerData) {
      const parsedServerData: Server = JSON.parse(storedServerData);
      if (parsedServerData && parsedServerData.serverList.length > 0) {
        setServerData(parsedServerData);
        if (!parsedServerData.selectedServer.serverId) {
          setServerData((prevData) => ({
            ...prevData,
            selectedServer: parsedServerData.serverList[0],
          }));
        }
      }
    } else {
      console.error("Данные серверов не найдены в localStorage.");
    }
  }, [serverData]);

  // Обработчик изменения выбора сервера
  const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedServerName = e.target.value;
    const selected = serverData.serverList.find(
      (server) => server.serverName === selectedServerName
    );

    if (selected) {
      const updatedServerData = {
        ...serverData,
        selectedServer: selected,
      };

      setServerData(updatedServerData);
      localStorage.setItem("servers", JSON.stringify(updatedServerData)); // Сохраняем обновленные данные в localStorage
    }
  };

  return (
    <article className={clsx("navbar")}>
      <nav className="navbar_container">
        {/* Логотип с изображением */}
        <div className="logo">
          <img src={LogoIcon} alt="Logo" className="logo-image" />
        </div>

        {/* Селектор выбора сервера */}
        <div className="server-selector">
          <label htmlFor="server-select">Select Server</label>
          <select
            id="server-select"
            value={serverData.selectedServer.serverName || ""}
            onChange={handleServerChange}
            disabled={serverData.serverList.length === 0} // Отключаем select, если серверов нет
          >
            {serverData.serverList.map((server) => (
              <option key={server.serverId} value={server.serverName}>
                {server.serverName}
              </option>
            ))}
          </select>
        </div>

        {/* Меню */}
        <div className="menu">
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/history">History</a>
          <a href="/">About</a>
        </div>
      </nav>
    </article>
  );
};
