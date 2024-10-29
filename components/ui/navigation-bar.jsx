import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import routes from '@/routes';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  const handleScroll = () => {
    if (window.scrollY > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled ? 'var(--background)' : '#00000000',
        marginTop: scrolled ? 8 : 5,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        ease: 'easeInOut',
      }}
      className="fixed top-0 flex flex-row justify-center rounded gap-4 mt-4 px-4 py-2 z-10 font-semibold max-w-full"
    >
      <Link className={buttonVariants({ variant: "ghost" })} href={routes.home}>Home</Link>
      <Link className={buttonVariants({ variant: "ghost" })} href={routes.about}>About</Link>
      <Link className={buttonVariants({ variant: "ghost" })} href={routes.contact}>Contact</Link>
      {session ? (
        <>
          <Link className={buttonVariants({ variant: "ghost" })} href={routes.inquiries}>Inquiries</Link>
          <Link className={buttonVariants({ variant: "ghost" })} href={routes.timesheet}>Timesheet</Link>
          <Link className={buttonVariants({ variant: "ghost" })} href={routes.employee}>Employee</Link>
          <Button
            onClick={() => signOut({ callbackUrl: routes.home })}
            >
            Logout
          </Button>
        </>
      ) : (
        <Link className={buttonVariants({ variant: "ghost" })} href={routes.login}>Login</Link>
      )}
      <ModeToggle/>
    </motion.nav>
  );
};

export default Navbar;