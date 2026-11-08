import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="app-container">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
