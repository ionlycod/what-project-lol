"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { config } from "@/lib/config"

const EMOJI_REACTIONS = [
  { type: "thumbsUp", label: "Got it!", icon: "👍" },
  { type: "thumbsDown", label: "Lost", icon: "👎" },
  { type: "confused", label: "Confused", icon: "😕" },
  { type: "lightbulb", label: "Idea", icon: "💡" },
] as const

export default function StudentPage() {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [reactionSent, setReactionSent] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check class status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/reactions")
      if (res.ok) {
        const data = await res.json()
        setIsActive(data.isActive)
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load and polling
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, config.refreshTime * 1000)
    return () => clearInterval(interval)
  }, [checkStatus])

  async function handleEmojiReaction(type: string, icon: string) {
    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      setReactionSent(icon)
      setTimeout(() => setReactionSent(null), 1500)
    } catch {
      // Ignore errors
    }
  }

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      })

      if (res.ok) {
        setMessage("")
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    } catch {
      // Ignore errors
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    router.push("/")
  }

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Student</h1>
        <Button variant="outline" size="sm" onClick={handleBack}>
          Back
        </Button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        {!isActive ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Class is not in session
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Wait for the teacher to start the class
            </p>
          </div>
        ) : (
          <>
            {/* Emoji Reactions */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Quick Reactions</p>
              <div className="flex gap-2">
                {EMOJI_REACTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleEmojiReaction(reaction.type, reaction.icon)}
                    className="text-4xl transition-transform hover:scale-110 active:scale-95"
                  >
                    {reaction.icon}
                  </button>
                ))}
              </div>
              {reactionSent && (
                <p className="text-sm text-green-600">
                  {reactionSent} Sent!
                </p>
              )}
            </div>

            {/* Text Message */}
            <Card className="w-full max-w-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-center text-base">
                  Send a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitMessage} className="flex flex-col gap-4">
                  <Input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your question or comment..."
                    autoComplete="off"
                    className="h-12 text-base"
                  />
                  <Button
                    type="submit"
                    className="h-12 text-base"
                    disabled={!message.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send"}
                  </Button>
                  {showSuccess && (
                    <p className="text-center text-sm text-green-600">
                      Message sent!
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
