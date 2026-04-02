"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { config } from "@/lib/config"

interface TextMessage {
  id: string
  content: string
  timestamp: string
}

interface ReactionCounts {
  thumbsUp: number
  thumbsDown: number
  confused: number
  lightbulb: number
}

const EMOJI_MAP = {
  thumbsUp: { icon: "👍", label: "Got it" },
  thumbsDown: { icon: "👎", label: "Lost" },
  confused: { icon: "😕", label: "Confused" },
  lightbulb: { icon: "💡", label: "Ideas" },
}

export default function TeacherPage() {
  const router = useRouter()
  const [isActive, setIsActive] = useState(false)
  const [messages, setMessages] = useState<TextMessage[]>([])
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
    thumbsUp: 0,
    thumbsDown: 0,
    confused: 0,
    lightbulb: 0,
  })
  const [summary, setSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch classroom state, messages, and reaction counts
  const fetchData = useCallback(async () => {
    try {
      const [classroomRes, reactionsRes] = await Promise.all([
        fetch("/api/classroom"),
        fetch("/api/reactions"),
      ])

      if (classroomRes.ok) {
        const data = await classroomRes.json()
        setIsActive(data.isActive)
      }

      if (reactionsRes.ok) {
        const data = await reactionsRes.json()
        setMessages(data.messages)
        setReactionCounts(data.reactionCounts)
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!isActive) return
    
    setSummaryLoading(true)
    try {
      const res = await fetch("/api/summary")
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      }
    } catch {
      // Ignore errors
    } finally {
      setSummaryLoading(false)
    }
  }, [isActive])

  // Reset reaction counts after reading them
  const resetReactionCounts = useCallback(async () => {
    try {
      await fetch("/api/reactions", { method: "PATCH" })
    } catch {
      // Ignore errors
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Polling for data - fetch, then reset reaction counts
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchData()
      await fetchSummary()
      await resetReactionCounts()
    }, config.refreshTime * 1000)
    return () => clearInterval(interval)
  }, [fetchData, fetchSummary, resetReactionCounts])

  // Fetch summary when session becomes active
  useEffect(() => {
    if (isActive) {
      fetchSummary()
    }
  }, [isActive, fetchSummary])

  async function handleToggleSession() {
    const newState = !isActive
    try {
      const res = await fetch("/api/classroom", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newState }),
      })
      if (res.ok) {
        setIsActive(newState)
        if (newState) {
          fetchSummary()
        }
      }
    } catch {
      // Ignore errors
    }
  }

  async function handleClearAll() {
    try {
      const res = await fetch("/api/reactions", { method: "DELETE" })
      if (res.ok) {
        setMessages([])
        setReactionCounts({ thumbsUp: 0, thumbsDown: 0, confused: 0, lightbulb: 0 })
        setSummary("")
      }
    } catch {
      // Ignore errors
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

  const totalReactions = reactionCounts.thumbsUp + reactionCounts.thumbsDown + reactionCounts.confused + reactionCounts.lightbulb

  return (
    <main className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Teacher Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleBack}>
          Back
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Controls */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500" : "bg-muted"}`} />
            <span className="font-medium">
              {isActive ? "Class in session" : "Class not active"}
            </span>
          </div>
          <Button
            onClick={handleToggleSession}
            variant={isActive ? "destructive" : "default"}
            size="sm"
          >
            {isActive ? "End Session" : "Start Session"}
          </Button>
        </div>

        {/* Reaction Counts */}
        <div className="flex items-center gap-4 text-lg">
          <span className="text-sm text-muted-foreground">Reactions:</span>
          {(Object.entries(EMOJI_MAP) as [keyof ReactionCounts, typeof EMOJI_MAP.thumbsUp][]).map(
            ([key, { icon }]) => (
              <span key={key} className="flex items-center gap-1">
                <span>{icon}</span>
                <span className="font-semibold">{reactionCounts[key]}</span>
              </span>
            )
          )}
        </div>

        {/* AI Summary */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">AI Summary</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchSummary}
              disabled={summaryLoading || !isActive}
            >
              {summaryLoading ? "Loading..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {!isActive ? (
              <p className="text-muted-foreground">
                Start the session to see AI summary
              </p>
            ) : summaryLoading && !summary ? (
              <p className="text-muted-foreground">Generating summary...</p>
            ) : (
              <div className="whitespace-pre-wrap text-sm">{summary}</div>
            )}
          </CardContent>
        </Card>

        {/* Text Messages Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Student Messages ({messages.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              disabled={messages.length === 0 && totalReactions === 0}
            >
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-muted-foreground">No messages yet</p>
            ) : (
              <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
                {messages
                  .slice()
                  .reverse()
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-lg border bg-muted/50 p-3"
                    >
                      <div className="mb-1 flex items-center justify-end">
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
