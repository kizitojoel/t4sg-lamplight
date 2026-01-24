import { TypographyH2 } from "@/components/ui/typography";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <TypographyH2>Welcome to the T4SG Lamplight Project!</TypographyH2>
      <Link href="/instructions">
        <button className="mt-4 rounded-md bg-[#a51d31] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8b1929]">
          View Instructions
        </button>
      </Link>
    </>
  );
}
