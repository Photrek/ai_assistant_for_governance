import React from "react";
import ReactDOM from "react-dom/client";
import { ReusableProvider } from "reusable";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./containers/Home/Home";

const routing = (
  <Router>
    <Routes>
      <Route path="/" element={ <Home /> } />
    </Routes>
  </Router>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ReusableProvider>
      <React.StrictMode>
        { routing }
      </React.StrictMode>
  </ReusableProvider>
);