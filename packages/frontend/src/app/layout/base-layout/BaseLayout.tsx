import { Outlet } from "react-router-dom";

import "./baseLayout.scss";

export const BaseLayout = () => {
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
