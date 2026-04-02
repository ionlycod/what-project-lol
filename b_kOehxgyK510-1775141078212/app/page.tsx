import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PortalPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Classroom Reactions</CardTitle>
          <CardDescription>
            Select your role to join the class
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="h-14 text-lg">
            <Link href="/teacher">I&apos;m a Teacher</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 text-lg">
            <Link href="/student">I&apos;m a Student</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
