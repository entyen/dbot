import "./landing.scss";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);
  return (
    <section className="langing-page">
      Home Page
    </section>
  );
};
