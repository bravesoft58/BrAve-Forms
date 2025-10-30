"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/ui/logo"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [subject, setSubject] = useState("sales")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSubmitted(true)
      toast({
        title: "Message sent",
        description: "Thank you for contacting us. We'll get back to you soon.",
      })
    } catch (error) {
      console.error("Contact form error:", error)
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
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground">Have questions about BrAve Forms? We're here to help.</p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-6 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <h3 className="text-lg font-medium">Thank you for contacting us!</h3>
                <p className="mt-2">We've received your message and will get back to you as soon as possible.</p>
              </div>
              <div className="text-center">
                <Link href="/">
                  <Button>Return to Home</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Your Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">I'm interested in</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Information</SelectItem>
                    <SelectItem value="demo">Request a Demo</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

