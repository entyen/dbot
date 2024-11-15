import { Outlet } from "react-router-dom";

import "./homeLayout.scss";
import { Navbar } from "@/widgets/layout";

export const HomeLayout = () => {
  return (
    <div className="home-layout">
      <Navbar />
      <div className="home-layout__wrapper">
        {/* <HomeTopBar/> */}
        <main className="home-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
