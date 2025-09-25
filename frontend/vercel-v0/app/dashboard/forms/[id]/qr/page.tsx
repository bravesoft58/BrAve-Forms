"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Download, FileText, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Form {
  id: string
  type: string
  project: {
    id: string
    name: string
  }
  submittedBy: string
  submittedDate: string
}

export default function QRCodePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForm = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock form data
      const mockForm: Form = {
        id: params.id,
        type: "Dust Control Log",
        project: {
          id: "1",
          name: "Downtown High-Rise",
        },
        submittedBy: "John Smith",
        submittedDate: "2024-03-02",
      }

      setForm(mockForm)
      setIsLoading(false)
    }

    fetchForm()
  }, [params.id])

  const handleDownload = () => {
    toast({
      title: "QR Code downloaded",
      description: "The QR code has been downloaded successfully.",
    })
  }

  const handleShare = () => {
    // In a real app, this would open a share dialog or copy the URL
    toast({
      title: "Link copied",
      description: "The form access link has been copied to your clipboard.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Form not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The form you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/forms" className="mt-4">
            <Button variant="outline">Back to Forms</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/forms/${params.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">QR Code Access</h1>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Form QR Code</CardTitle>
            <CardDescription>Scan this QR code to access the form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-lg border bg-white p-4">
                <Image
                  src={`/placeholder.svg?height=300&width=300&text=QR+Code`}
                  alt="QR Code"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Information</CardTitle>
            <CardDescription>Details about the form this QR code links to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{form.type}</h3>
                  <p className="text-sm text-muted-foreground">{form.project.name}</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">QR Code Access Information</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Access Type:</span>
                    <span>Read-only</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expiration:</span>
                    <span>Never</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Authentication Required:</span>
                    <span>No</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-200">Important Note</h3>
                <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                  This QR code provides read-only access to the form. Anyone with this QR code can view the form's
                  content without needing to log in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

