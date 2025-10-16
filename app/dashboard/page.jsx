"use client"
import AuthForm from "../../components/AuthForm"
import UserMenu from "../../components/UserMenu"
// import UploadDocument from "../../components/UploadDocument"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <AuthForm />
      <UserMenu />
      {/* <UploadDocument /> */}
    </main>
  )
}
