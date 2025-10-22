"use client";
import Link from "next/link";   // 👈 import Link
import UserMenu from "./UserMenu";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* 👇 Make title clickable */}
          <Link href="/" className="text-xl font-bold text-indigo-600 hover:underline">
            LexFlowLegal Dashboard
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
