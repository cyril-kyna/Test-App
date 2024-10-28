import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router"; // Import useRouter hook
import routes from '@/routes';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

const EmployeeNavbar = () => {
  const router = useRouter(); // Initialize useRouter to get current path

  return (
    <nav className="flex flex-row gap-3">
      <Link
        className={`${buttonVariants({ variant: "ghost" })} text-xl rounded-none ${
          router.pathname === routes.employee ? "text-primary border-b-2 border-primary rounded-none hover:text-primary" : "text-white"
        }`}
        href={routes.employee}
      >
        Payrate
      </Link>
      <Link
        className={`${buttonVariants({ variant: "ghost" })} text-xl rounded-none ${
          router.pathname === routes.payout ? "text-primary border-b-2 border-primary rounded-none hover:text-primary" : "text-white"
        }`}
        href={routes.payout}
      >
        Payout
      </Link>
    </nav>
  );
};

export default EmployeeNavbar;