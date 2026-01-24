import { getFullUserProfile } from "@/lib/server-utils";
import LoginButton from "./login-button";
import UserNav from "./user-nav";

export default async function AuthStatus() {
  // Use cached function to get user profile efficiently
  const userProfile = await getFullUserProfile();

  if (!userProfile) {
    return <LoginButton />;
  }

  const { profile } = userProfile;

  return <UserNav profile={profile} />;
}
