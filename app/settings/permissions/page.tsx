import PermissionsClient from "@/app/settings/permissions/permissions-client";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

export default async function PermissionsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return <PermissionsClient />;
}
