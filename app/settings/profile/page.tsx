import { Separator } from "@/components/ui/separator";
import { getFullUserProfile } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function Settings() {
  const userProfile = await getFullUserProfile();

  if (!userProfile) {
    // this is a protected route - only users who are signed in can view this route
    redirect("/");
  }

  const { profile } = userProfile;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-muted-foreground text-sm">This is how others will see you on the site.</p>
        </div>
        <Separator />
        <ProfileForm profile={profile} />
      </div>
    </>
  );
}
