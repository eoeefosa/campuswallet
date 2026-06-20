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

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: <IoHomeSharp /> },
  { href: "/expenses", label: "Expenses", icon: <GiExpense /> },
  { href: "/budgets", label: "Budgets", icon: <FaMoneyBillWheat /> },
  { href: "/wallet", label: "Wallet", icon: <FaWallet /> },
  { href: "/reports", label: "Reports", icon: <TbReportMoney /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
            className="w-full text-left text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 bg-white">{children}</main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10 flex">
        {NAV.map(({ href, label, icon }) => {
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
      </nav>
    </div>
  );
}
