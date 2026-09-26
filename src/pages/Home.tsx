import React from "react";
import { Routes, Route } from "react-router-dom";
import Issues from "./Issue/Issues";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import CreateIssue from "./Issue/Form";
import Logout from "./auth/Logout";
import Sidebar from "../layout/Sidebar";
import AsidePanel from "../layout/AsidePanel";

const Home: React.FC = () => {
  return (
    <div className="app-shell__body">
      <div className="app-shell__sidebar">
        <Sidebar />
      </div>

      <main className="app-shell__main">
        <Issues />
      </main>

      <div className="app-shell__aside">
        <AsidePanel />
      </div>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create-issue" element={<CreateIssue />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={<></>} />
      </Routes>
    </div>
  );
};

export default Home;
