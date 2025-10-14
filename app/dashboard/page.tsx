import { Button } from "@/components/ui/button";
import { TypographyH2, TypographyP } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  // Create supabase server component client and obtain user session from Supabase Auth
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // this is a protected route - only users who are signed in can view this route

    /*
      Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.
      Always use supabase.auth.getUser() to protect pages and user data.
      Never trust supabase.auth.getSession() inside server code such as middleware. It isn't guaranteed to revalidate the Auth token.
      It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.
    */

    redirect("/");
  }

  const userEmail = user.email;

  return (
    <>
      <div className="flex items-center justify-between">
        <TypographyH2 className="border-b-0">Dashboard</TypographyH2>
        <Link href="/dashboard/newstudent">
          <Button className="cursor-pointer">Add Student</Button>
        </Link>
      </div>
      <div className="border-b"></div>
      <TypographyP>This is a protected route accessible only to signed-in users.</TypographyP>
      {userEmail && <TypographyP>{`Your email is ${userEmail}`}</TypographyP>}

      {/* temp button to students page */}
      <div style={{ marginTop: "20px" }}>
        <Link
          href="/dashboard/students"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
          }}
        >
          View Students
        </Link>
      </div>
    </>
  );
}
