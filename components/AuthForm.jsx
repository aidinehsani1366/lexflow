"use client"
import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage("✅ Logged in!")
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage("✅ Account created! Please check your email.")
      }
    } catch (err) {
      setMessage("❌ " + err.message)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-sm mx-auto">
      <h3 className="text-lg font-bold mb-2">{isLogin ? "Login" : "Sign Up"}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="border rounded w-full p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded w-full p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>
      <button
        className="text-sm text-indigo-600 mt-2"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  )
}
