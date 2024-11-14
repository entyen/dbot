import { Outlet } from "react-router-dom";

import "./baseLayout.scss";
import { TelegramAuth } from "@/features/auth";

export const BaseLayout = () => {
  //TODO uncomment for tg Auth Work
  // TelegramAuth()

  return (
    <div className="base-layout">
      <div className="base-layout__wrapper">
        <main className="base-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
