import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Issues from "./Issue/Issues";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import CreateIssue from "./Issue/Form";
import Logout from "./auth/Logout";
import Sidebar from "../layout/Sidebar";
import AsidePanel from "../layout/AsidePanel";
import ModelsPage from "./Models/ModelsPage";
import AgentProfilePage from "./Agent/AgentProfilePage";
import EcosystemPage from "./Organisms/EcosystemPage";

const Home: React.FC = () => {
  const location = useLocation();
  const isModelsPage = location.pathname.startsWith("/models");
  const isAgentPage = location.pathname.startsWith("/agent");
  const isEcosystemPage = location.pathname.startsWith("/ecosystem");
  const isWidePage = isModelsPage || isAgentPage || isEcosystemPage;

  return (
    <div className="app-shell__body">
      <div className="app-shell__sidebar">
        <Sidebar />
      </div>

      <main className="app-shell__main" style={isWidePage ? { gridColumn: "span 2" } : {}}>
        {isEcosystemPage ? (
          <EcosystemPage />
        ) : isAgentPage ? (
          <AgentProfilePage key={location.pathname} />
        ) : isModelsPage ? (
          <ModelsPage />
        ) : (
          <Issues />
        )}
      </main>

      {!isWidePage && (
        <div className="app-shell__aside">
          <AsidePanel />
        </div>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create-issue" element={<CreateIssue />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/models" element={<></>} />
        <Route path="/agent/:code" element={<></>} />
        <Route path="/ecosystem" element={<></>} />
        <Route path="/" element={<></>} />
      </Routes>
    </div>
  );
};

export default Home;
