import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import SidebarLinkGroup from "./SidebarLinkGroup";

function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  variant = 'default',
}) {
  const location = useLocation();
  const { pathname } = location;
  const { user, userProfile, logout } = useAuth();

  // Kullanıcı tipini belirle
  const isBeekeeper = user && user.userType === 'beekeeper';
  const isSystemAdmin = user && user.userType === 'admin';

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(storedSidebarExpanded === null ? false : storedSidebarExpanded === "true");

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded);
    if (sidebarExpanded) {
      document.querySelector("body").classList.add("sidebar-expanded");
    } else {
      document.querySelector("body").classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:w-64! shrink-0 bg-gradient-to-b from-amber-50 to-orange-50 dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} ${variant === 'v2' ? 'border-r border-amber-200 dark:border-gray-700/60' : 'rounded-r-2xl shadow-xs'}`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-amber-600 hover:text-blue-600"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <NavLink end to="/" className="block">
            <div className="flex items-center space-x-3">
              <svg className="fill-amber-500" xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 40 40">
                {/* Digital Twin Grid Background */}
                <defs>
                  <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                    <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#F59E0B" strokeWidth="0.2" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="40" height="40" fill="url(#grid)" opacity="0.4" />

                {/* Outer Digital Ring */}
                <circle cx="20" cy="20" r="18" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.8" />

                {/* Data Flow Rings */}
                <circle cx="20" cy="20" r="14" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="2,1" opacity="0.6" />
                <circle cx="20" cy="20" r="10" fill="none" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="1.5,1" opacity="0.5" />

                {/* Digital Twin Bees - Physical & Virtual */}
                <g id="physicalBee">
                  {/* Physical Bee (Left) */}
                  <ellipse cx="15" cy="20" rx="3" ry="4" fill="#FDE047" stroke="#F59E0B" strokeWidth="0.5" />
                  <line x1="13" y1="18" x2="17" y2="18" stroke="#B45309" strokeWidth="0.8" />
                  <line x1="13" y1="20" x2="17" y2="20" stroke="#B45309" strokeWidth="0.8" />
                  <line x1="13" y1="22" x2="17" y2="22" stroke="#B45309" strokeWidth="0.8" />

                  {/* Physical Wings */}
                  <ellipse cx="12" cy="17" rx="2" ry="1.5" fill="#60A5FA" opacity="0.7" />
                  <ellipse cx="18" cy="17" rx="2" ry="1.5" fill="#60A5FA" opacity="0.7" />

                  {/* Physical Head */}
                  <circle cx="15" cy="16" r="1.5" fill="#F59E0B" />
                  <circle cx="15" cy="16" r="0.8" fill="#DC2626" />
                </g>

                <g id="virtualBee">
                  {/* Virtual Bee (Right) - Wireframe Style */}
                  <ellipse cx="25" cy="20" rx="3" ry="4" fill="none" stroke="#3B82F6" strokeWidth="1.2" strokeDasharray="0.8,0.8" />
                  <line x1="23" y1="18" x2="27" y2="18" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />
                  <line x1="23" y1="20" x2="27" y2="20" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />
                  <line x1="23" y1="22" x2="27" y2="22" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />

                  {/* Virtual Wings */}
                  <ellipse cx="22" cy="17" rx="2" ry="1.5" fill="none" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />
                  <ellipse cx="28" cy="17" rx="2" ry="1.5" fill="none" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />

                  {/* Virtual Head */}
                  <circle cx="25" cy="16" r="1.5" fill="none" stroke="#3B82F6" strokeWidth="1" />
                  <circle cx="25" cy="16" r="0.8" fill="#3B82F6" opacity="0.6" />
                </g>

                {/* Digital Twin Connection */}
                <path d="M18 20 L22 20" stroke="#10B981" strokeWidth="2" strokeDasharray="2,1" opacity="0.8" />
                <path d="M18 20 L22 20" stroke="#10B981" strokeWidth="0.5" strokeDasharray="1,1" opacity="1">
                  <animate attributeName="stroke-dashoffset" values="0;4" dur="2s" repeatCount="indefinite" />
                </path>

                {/* Data Nodes */}
                <circle cx="8" cy="8" r="1.5" fill="#10B981" />
                <circle cx="32" cy="8" r="1.5" fill="#3B82F6" />
                <circle cx="8" cy="32" r="1.5" fill="#10B981" />
                <circle cx="32" cy="32" r="1.5" fill="#3B82F6" />

                {/* Digital Twin Data Flow */}
                <path d="M8 8 L15 16 L25 16 L32 8" stroke="#10B981" strokeWidth="0.8" opacity="0.6" />
                <path d="M8 32 L15 24 L25 24 L32 32" stroke="#3B82F6" strokeWidth="0.8" opacity="0.6" />

                {/* IoT Sensors */}
                <circle cx="6" cy="20" r="1" fill="#EF4444" />
                <circle cx="34" cy="20" r="1" fill="#EF4444" />
                <circle cx="20" cy="6" r="1" fill="#EF4444" />
                <circle cx="20" cy="34" r="1" fill="#EF4444" />

                {/* Sensor Signals */}
                <line x1="6" y1="20" x2="12" y2="20" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />
                <line x1="34" y1="20" x2="28" y2="20" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />
                <line x1="20" y1="6" x2="20" y2="12" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />
                <line x1="20" y1="34" x2="20" y2="28" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />
              </svg>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                BeeTwin
              </span>
            </div>
          </NavLink>
        </div>

        {/* Links */}
        <div className="space-y-8">
          {/* Beekeeper Dashboard */}
          {isBeekeeper && (
            <div>
              <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
                <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                  🐝
                </span>
                <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">Dijital İkiz Arıcılık</span>
              </h3>
              <ul className="mt-3">
                {/* Dashboard */}
                <SidebarLinkGroup activecondition={pathname === "/" || pathname.includes("dashboard")}>
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <a
                          href="#0"
                          className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/" || pathname.includes("dashboard") ? "" : "hover:text-gray-900 dark:hover:text-white"
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleClick();
                            setSidebarExpanded(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className={`shrink-0 fill-current ${pathname === "/" || pathname.includes("dashboard") ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                                <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
                                <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
                              </svg>
                              <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                🐝 Arıcı Paneli
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 ${open && "rotate-180"}`} viewBox="0 0 12 12">
                                <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                              </svg>
                            </div>
                          </div>
                        </a>
                        <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                          <ul className={`pl-8 mt-1 ${!open && "hidden"}`}>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🏠 Ana Dashboard
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/sensor-analytics"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  📊 Sensör Analizi
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/hive-monitoring"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🐝 Gerçek Zamanlı İzleme
                                </span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>

                {/* Arılık Yönetimi */}
                <SidebarLinkGroup activecondition={pathname.includes("apiaries") || pathname.includes("hives")}>
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <a
                          href="#0"
                          className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname.includes("apiaries") || pathname.includes("hives") ? "" : "hover:text-gray-900 dark:hover:text-white"
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleClick();
                            setSidebarExpanded(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className={`shrink-0 fill-current ${pathname.includes('apiaries') || pathname.includes('hives') ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                                <path d="M9 6.855A3.502 3.502 0 0 0 8 0a3.5 3.5 0 0 0-1 6.855v1.656L5.534 9.65a3.5 3.5 0 1 0 1.229 1.578L8 10.267l1.238.962a3.5 3.5 0 1 0 1.229-1.578L9 8.511V6.855ZM6.5 3.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm4.803 8.095c.005-.005.01-.01.013-.016l.012-.016a1.5 1.5 0 1 1-.025.032ZM3.5 11c.474 0 .897.22 1.171.563l.013.016.013.017A1.5 1.5 0 1 1 3.5 11Z" />
                              </svg>
                              <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                🏡 Arılık Yönetimi
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 ${open && "rotate-180"}`} viewBox="0 0 12 12">
                                <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                              </svg>
                            </div>
                          </div>
                        </a>
                        <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                          <ul className={`pl-8 mt-1 ${!open && "hidden"}`}>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/apiaries"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🏡 Arılık Listesi
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/hives"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🏠 Kovan Yönetimi
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/colonies"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🐝 Koloni Sağlığı
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/inspections"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🔍 Muayene Kayıtları
                                </span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>

                {/* Üretim & Satış */}
                <SidebarLinkGroup activecondition={pathname.includes("production") || pathname.includes("sales")}>
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <a
                          href="#0"
                          className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname.includes("production") || pathname.includes("sales") ? "" : "hover:text-gray-900 dark:hover:text-white"
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleClick();
                            setSidebarExpanded(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className={`shrink-0 fill-current ${pathname.includes('production') || pathname.includes('sales') ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                                <path d="M12 1a1 1 0 1 0-2 0v2a3 3 0 0 0 3 3h2a1 1 0 1 0 0-2h-2a1 1 0 0 1-1-1V1ZM1 10a1 1 0 1 0 0 2h2a1 1 0 0 1 1 1v2a1 1 0 1 0 2 0v-2a3 3 0 0 0-3-3H1ZM5 0a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3H1a1 1 0 0 1 0-2h2a1 1 0 0 0 1-1V1a1 1 0 0 1 1-1ZM12 13a1 1 0 0 1 1-1h2a1 1 0 1 0 0-2h-2a3 3 0 0 0-3 3v2a1 1 0 1 0 2 0v-2Z" />
                              </svg>
                              <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                🍯 Üretim & Satış
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 ${open && "rotate-180"}`} viewBox="0 0 12 12">
                                <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                              </svg>
                            </div>
                          </div>
                        </a>
                        <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                          <ul className={`pl-8 mt-1 ${!open && "hidden"}`}>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/honey-production"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🍯 Bal Üretimi
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/harvest"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  📦 Hasat Kayıtları
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/inventory"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  📋 Envanter
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/orders"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🛒 Siparişler
                                </span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>
              </ul>
            </div>
          )}

          {/* Admin Dashboard */}
          {isSystemAdmin && (
            <div>
              <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
                <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                  ⚙️
                </span>
                <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">Admin Yönetim Paneli</span>
              </h3>
              <ul className="mt-3">
                {/* Admin Dashboard */}
                <SidebarLinkGroup activecondition={pathname === "/admin" || pathname.includes("admin")}>
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <a
                          href="#0"
                          className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/admin" || pathname.includes("admin") ? "" : "hover:text-gray-900 dark:hover:text-white"
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleClick();
                            setSidebarExpanded(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className={`shrink-0 fill-current ${pathname === "/admin" || pathname.includes("admin") ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
                                <path d="M6.879 9.879a3 3 0 1 1 2.242-2.242l-2.242 2.242Z" />
                              </svg>
                              <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                ⚙️ Admin Paneli
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 ${open && "rotate-180"}`} viewBox="0 0 12 12">
                                <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                              </svg>
                            </div>
                          </div>
                        </a>
                        <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                          <ul className={`pl-8 mt-1 ${!open && "hidden"}`}>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/admin"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🏠 Admin Dashboard
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/admin/users"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  👥 Kullanıcı Yönetimi
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/admin/sensors"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  📡 Sensör Yönetimi
                                </span>
                              </NavLink>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <NavLink
                                end
                                to="/admin/system"
                                className={({ isActive }) =>
                                  "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                                }
                              >
                                <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  🛠️ Sistem Ayarları
                                </span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>
              </ul>
            </div>
          )}

          {/* Authentication & Profile - Tüm kullanıcılar için */}
          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                👤
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">Hesap & Yönetim</span>
            </h3>
            <ul className="mt-3">
              {/* Profile */}
              <li className="px-3 py-2 rounded-lg mb-0.5 last:mb-0">
                <NavLink
                  end
                  to="/profile"
                  className={({ isActive }) =>
                    "block transition duration-150 truncate " + (isActive ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")
                  }
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 shrink-0 fill-current text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                    </svg>
                    <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                      👤 Profilim
                    </span>
                  </div>
                </NavLink>
              </li>

              {/* Logout */}
              <li className="px-3 py-2 rounded-lg mb-0.5 last:mb-0">
                <button
                  onClick={() => {
                    logout();
                    // Sayfayı yenile veya anasayfaya yönlendir
                    window.location.href = '/';
                  }}
                  className="w-full text-left block transition duration-150 truncate text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 shrink-0 fill-current text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                      <path d="M15 2H9a1 1 0 0 0 0 2h4v8H9a1 1 0 0 0 0 2h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1ZM8.707 7.293a1 1 0 0 0-1.414 0L5.586 9H11a1 1 0 0 0 0-2H5.586l1.707-1.707a1 1 0 0 0-1.414-1.414l-3 3a1 1 0 0 0 0 1.414l3 3a1 1 0 0 0 1.414-1.414L5.586 9H11a1 1 0 0 0 0-2H5.586l1.707-1.707Z" />
                    </svg>
                    <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                      🚪 Çıkış Yap
                    </span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
          <div className="w-12 pl-4 pr-3 py-2">
            <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              <span className="sr-only">Expand / collapse sidebar</span>
              <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 sidebar-expanded:rotate-180" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <path d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
