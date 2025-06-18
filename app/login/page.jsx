"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../lib/auth-provider"
import { Box, Button, Container, TextField, Typography, Paper, Alert } from "@mui/material"
import { Medication as MedicationIcon } from "@mui/icons-material"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      router.push("/dashboard")
    } catch (error) {
      setError(error.message || "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Container maxWidth="sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <MedicationIcon className="text-white text-3xl" />
          </div>
          <Typography component="h1" variant="h3" className="font-bold text-gray-800 mb-2">
            MedReminder
          </Typography>
          <Typography variant="h6" className="text-gray-600">
            Your Personal Medicine Assistant
          </Typography>
        </div>

        <Paper elevation={8} className="p-8 rounded-2xl shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20">
          <Typography component="h2" variant="h4" className="text-center font-semibold text-gray-800 mb-6">
            Welcome Back
          </Typography>

          {error && (
            <Alert severity="error" className="mb-4 rounded-lg">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="space-y-4">
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 rounded-lg"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 rounded-lg"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              className="mt-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-semibold shadow-lg transform transition hover:scale-105"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center mt-6">
              <Typography variant="body2" className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                  Create Account
                </Link>
              </Typography>
            </div>
          </Box>
        </Paper>
      </Container>
    </div>
  )
}