import { SidebarNav } from "@/components/global/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { PageHeader1, PageSubHeader1 } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  // Create supabase server component client and obtain user session from Supabase Auth
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // this is a protected route - only users who are signed in can view this route
    redirect("/");
  }

  // Fetch user's profile from the database to check for admin role
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  // If there's an error fetching the profile, treat as unauthorized or not admin
  const isAdmin = !!profile && profile.role === "admin";

  const sidebarNavItems = [
    {
      title: "General",
      href: "/settings/general",
    },
    {
      title: "Profile",
      href: "/settings/profile",
    },
    {
      title: "Admin",
      href: "/settings/admin",
    },
    ...(isAdmin
      ? [
          {
            title: "Permissions",
            href: "/settings/permissions",
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="space-y-0.5">
        <PageHeader1>Settings</PageHeader1>
        <PageSubHeader1>Manage your account and profile settings.</PageSubHeader1>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="relative z-10 -mx-4 mb-8 lg:static lg:mx-0 lg:mr-12 lg:mb-0 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="z-0 ml-0 flex-1 lg:ml-0 lg:max-w-2xl">{children}</div>
      </div>
    </>
  );
}
