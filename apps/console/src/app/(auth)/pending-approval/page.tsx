import Link from "next/link"
import { Clock3 } from "lucide-react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PendingApprovalPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
            <Logo size={24} />
          </div>
          Eudora Console
        </Link>
        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto flex size-11 items-center justify-center rounded-md">
              <Clock3 className="size-5" />
            </div>
            <CardTitle className="text-xl">Account pending approval</CardTitle>
            <CardDescription>
              Your account was created successfully. A superadmin must activate it before you can enter the console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
