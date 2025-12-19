"use client";

import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { cn } from "@/lib/utils";
import { type User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // Fetch user auth status
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return (
    <nav className={cn("flex items-center space-x-8", className)} {...props}>
      {/* Logo Section */}
      <div className="flex items-center">
        <Image
          src="/lamplight_logo.png"
          alt="Lamplight"
          width={180}
          height={180}
          style={{ height: "auto" }}
          className="w-40"
        />
      </div>

      {/* Navigation Links */}
      <Link href="/" className="relative py-5 text-sm font-medium transition-colors">
        <span
          className={cn(
            "inline-block border-b-2 pb-1",
            pathname === "/" ? "text-foreground border-[#a51d31]" : "text-muted-foreground border-transparent",
          )}
        >
          Home
        </span>
      </Link>
      {user && (
        <Link href="/dashboard/students" className="relative py-5 text-sm font-medium transition-colors">
          <span
            className={cn(
              "inline-block border-b-2 pb-1",
              pathname?.includes("/dashboard/students")
                ? "text-foreground border-[#a51d31]"
                : "text-muted-foreground border-transparent",
            )}
          >
            Students
          </span>
        </Link>
      )}
    </nav>
  );
}
