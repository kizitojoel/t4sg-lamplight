import PermissionsClient from "@/app/settings/permissions/permissions-client";
import { requireAdmin } from "@/lib/server-utils";

export default async function PermissionsPage() {
  // requireAdmin() will redirect to home if user is not admin
  await requireAdmin();

  return <PermissionsClient />;
}
