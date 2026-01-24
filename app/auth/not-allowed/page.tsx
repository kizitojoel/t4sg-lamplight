import { Button } from "@/components/ui/button";
import { PageHeader1, PageSubHeader1 } from "@/components/ui/typography";
import Link from "next/link";

export default function NotAllowedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <PageHeader1>Access Denied</PageHeader1>
          <PageSubHeader1>
            Your email address is not on the allowed list for this application. Please contact an administrator if you
            believe this is an error.
          </PageSubHeader1>
        </div>
        <div className="pt-4">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
