"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, clearAuth, getStoredUser } from "@/lib/api";
import { User } from "@/lib/types";
import { IoHomeSharp } from "react-icons/io5";
import { GiExpense } from "react-icons/gi";
import { FaMoneyBillWheat, FaWallet } from "react-icons/fa6";
import { TbReportMoney } from "react-icons/tb";
import { BiQrScan, BiDotsHorizontalRounded } from "react-icons/bi";
import { RiRobot2Line } from "react-icons/ri";
import { LuCalculator } from "react-icons/lu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: <IoHomeSharp /> },
  { href: "/expenses", label: "Expenses", icon: <GiExpense /> },
  { href: "/budgets", label: "Budgets", icon: <FaMoneyBillWheat /> },
  { href: "/wallet", label: "Wallet", icon: <FaWallet /> },
  { href: "/transfer", label: "Transfer", icon: <BiQrScan /> },
  { href: "/reports", label: "Reports", icon: <TbReportMoney /> },
  { href: "/plan", label: "Planner", icon: <LuCalculator /> },
  { href: "/assistant", label: "Assistant", icon: <RiRobot2Line /> },
];

// Mobile layout:
//  - bottom bar: 3 primary items + a "More" button (4 slots total)
//  - floating vertical FABs on the right: Reports, Planner, Assistant
//  - "More" sheet: whatever is left (Budgets, Transfer)
const MOBILE_PRIMARY = ["/dashboard", "/expenses", "/wallet"];
const MOBILE_FAB = ["/reports", "/plan", "/assistant"];
const primaryNav = NAV.filter((n) => MOBILE_PRIMARY.includes(n.href));
const fabNav = NAV.filter((n) => MOBILE_FAB.includes(n.href));
const moreNav = NAV.filter(
  (n) => !MOBILE_PRIMARY.includes(n.href) && !MOBILE_FAB.includes(n.href),
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setAuthenticated(true);
    setUser(getStoredUser());
    setLoading(false);
  }, [router]);

  // Close the mobile "More" sheet whenever the route changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-10">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
          <span className="text-2xl"></span>
          <span className="text-lg font-bold text-blue-700">CampusWallet</span>
        </div>

        <nav className="flex-1 px-3 py-7 space-y-7">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1 truncate">
            {user?.name ?? "—"}
          </div>

          <div className="text-xs text-gray-400 mb-3 truncate">
            {user?.school ?? "—"}
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-blue-500 hover:text-blue-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 bg-white">{children}</main>

      {/* Mobile floating shortcuts — Reports, Planner, Assistant */}
      <div className="md:hidden fixed right-4 bottom-24 z-20 flex flex-col gap-3">
        {fabNav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border border-gray-200"
              }`}
            >
              {icon}
            </Link>
          );
        })}
      </div>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-20">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 pb-6 shadow-xl">
            <div className="mx-auto w-10 h-1 bg-gray-300 rounded-full mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {moreNav.map(({ href, label, icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-colors ${
                      active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 text-sm text-red-500 hover:text-red-700 font-medium py-2"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Mobile Nav — 3 primary + More */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10 flex">
        {primaryNav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium gap-0.5 transition-colors ${
                active ? "text-blue-700" : "text-gray-500"
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium gap-0.5 transition-colors ${
            moreOpen || moreNav.some((n) => n.href === pathname)
              ? "text-blue-700"
              : "text-gray-500"
          }`}
        >
          <span className="text-xl"><BiDotsHorizontalRounded /></span>
          More
        </button>
      </nav>
    </div>
  );
}
