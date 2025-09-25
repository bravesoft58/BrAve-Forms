"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

interface Comment {
  id: string
  formId: string
  author: string
  role: string
  content: string
  timestamp: string
}

interface FormCommentProps {
  formId: string
}

export function FormComment({ formId }: FormCommentProps) {
  const { user } = useAuth()
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!comment.trim()) return

    setIsSubmitting(true)

    try {
      // Show loading toast
      toast({
        title: "Submitting comment...",
        description: "Please wait while we save your comment.",
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create new comment
      const newComment: Comment = {
        id: Date.now().toString(),
        formId,
        author: user?.name || "Anonymous",
        role: user?.role || "guest",
        content: comment,
        timestamp: new Date().toISOString(),
      }

      // Add to comments
      setComments((prev) => [...prev, newComment])

      // Clear input
      setComment("")

      // Show success toast
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding comment:", error)

      // Show error toast
      toast({
        title: "Error",
        description: "There was a problem adding your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground capitalize">({comment.role})</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(comment.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-4">
          No comments yet. Be the first to add a comment.
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          placeholder="Add your comments or notes about this form..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmitComment} disabled={isSubmitting || !comment.trim()}>
            {isSubmitting ? "Submitting..." : "Add Comment"}
          </Button>
        </div>
      </div>
    </div>
  )
}

