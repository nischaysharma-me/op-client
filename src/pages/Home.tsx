import React from "react";
import { Routes, Route } from "react-router-dom";
import Issues from "./Issue/Issues";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import CreateIssue from "./Issue/Form";
import Logout from "./auth/Logout";

const Home: React.FC = () => {
  return (
    <>
      <main className="content">
        <div className="issue-box">
          <Issues />
        </div>
      </main>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create-issue" element={<CreateIssue />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={<></>} />
      </Routes>
    </>
  );
};

export default Home;
