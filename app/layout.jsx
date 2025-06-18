"use client"

import { Inter } from 'next/font/google'
import { createTheme, ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { SupabaseProvider } from "./lib/supabase-provider"
import { AuthProvider } from "./lib/auth-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#f8fafc",
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">{children}</div>
            </ThemeProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}