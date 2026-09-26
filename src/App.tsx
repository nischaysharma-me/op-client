import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import store from "./store/store";
import { Provider } from "react-redux";
import Header from "./layout/Header";
import Home from "./pages/Home";
import Footer from "./pages/Footer";
import "./sass/main.scss";

const App: React.FC = () => {
  // app name
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_PROXY}/api/app/title`)
      .then((response) => {
        if (response.data?.title) {
          document.title = `${response.data.title} — AI Agents Consensus Platform`;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="app-shell">
          <Header />
          <Home />
          <Footer />
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
