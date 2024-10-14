import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import routes from '@/routes';
import { useSession, signOut } from "next-auth/react";

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
        backgroundColor: scrolled ? 'var(--dark-grey)' : 'var(--transparent)',
        marginTop: scrolled ? 8 : 5,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        ease: 'easeInOut',
      }}
      className="fixed top-0 flex flex-row justify-center rounded gap-4 mt-4 px-4 py-2 z-10 font-semibold max-w-full"
    >
      <Link className="px-6 py-2 rounded hover:bg-[--grey] hover:text-[var(--white)] duration-300 ease-in-out" href={routes.home}>Home</Link>
      <Link className="px-6 py-2 rounded hover:bg-[--grey] hover:text-[var(--white)] duration-300 ease-in-out" href={routes.about}>About</Link>
      <Link className="px-6 py-2 rounded hover:bg-[--grey] hover:text-[var(--white)] duration-300 ease-in-out" href={routes.contact}>Contact</Link>
      {session ? (
        <>
          <Link className="px-6 py-2 rounded hover:bg-[--grey] hover:text-[var(--white)] duration-300 ease-in-out" href={routes.timesheet}>Timesheet</Link>
          <Link className="px-6 py-2 rounded hover:bg-[--grey] hover:text-[var(--white)] duration-300 ease-in-out" href={routes.inquries}>Inquiries</Link>
          <button
            onClick={() => signOut({ callbackUrl: routes.home })}
            className="px-6 py-2 rounded bg-[var(--white)] hover:bg-[var(--grey-white)] text-[var(--dark)] duration-300 ease-in-out"
          >
            Logout
          </button>
        </>
      ) : (
        <Link className="px-6 py-2 rounded bg-[var(--white)] hover:bg-[var(--grey-white)] text-[var(--dark)] duration-300 ease-in-out" href={routes.login}>Login</Link>
      )}
    </motion.nav>
  );
};

export default Navbar;