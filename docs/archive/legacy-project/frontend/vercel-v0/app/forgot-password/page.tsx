"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/ui/logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Basic validation
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a successful password reset request
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSubmitted(true)
      toast({
        title: "Password reset email sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
      })
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4 md:px-6">
        <Logo href="/" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <p>Password reset email sent!</p>
                <p className="mt-2 text-sm">
                  If an account exists with the email you provided, you will receive instructions to reset your
                  password.
                </p>
              </div>
              <div className="text-center">
                <Link href="/login">
                  <Button variant="link">Return to login</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Instructions"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

