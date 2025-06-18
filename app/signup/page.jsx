"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../lib/auth-provider"
import { Box, Button, Container, TextField, Typography, Paper, Alert } from "@mui/material"
import { Medication as MedicationIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await signUp(email, password)
      if (error) throw error
      
      // Show success message instead of redirecting
      setSuccess(true)
    } catch (error) {
      setError(error.message || "Failed to sign up")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Container maxWidth="sm">
          <Paper elevation={8} className="p-8 rounded-2xl shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
              <CheckCircleIcon className="text-white text-3xl" />
            </div>
            <Typography component="h1" variant="h4" className="font-bold text-gray-800 mb-4">
              Check Your Email! 📧
            </Typography>
            <Typography variant="body1" className="text-gray-600 mb-6">
              We've sent a confirmation email to <strong>{email}</strong>
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-6">
              Please click the link in the email to verify your account, then return to sign in.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl px-8 py-3"
            >
              Go to Sign In
            </Button>
          </Paper>
        </Container>
      </div>
    )
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
            Start Your Health Journey
          </Typography>
        </div>

        <Paper elevation={8} className="p-8 rounded-2xl shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20">
          <Typography component="h2" variant="h4" className="text-center font-semibold text-gray-800 mb-6">
            Create Account
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
              label="Password (min 6 characters)"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center mt-6">
              <Typography variant="body2" className="text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                  Sign In
                </Link>
              </Typography>
            </div>
          </Box>
        </Paper>
      </Container>
    </div>
  )
}