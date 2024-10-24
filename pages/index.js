import { useSession } from "next-auth/react";
import { Playfair } from "next/font/google";

const playfair = Playfair({ 
  subsets: ['latin'] 
});

export default function Home() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    // While checking session, display loading
    return <div>Loading...</div>;
  }
  return (
    <div>
      {session ? (
          <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>
            Welcome,
            <br></br> 
            <p className="text-white">
              {session.user.username}!
            </p>
          </h1>
      ) : (
          <h2 className={`${playfair.className} mt-40 text-center text-[5rem] font-[900] uppercase`}>
            Welcome,
            <br></br> 
            <p className="text-white">
              Random User
            </p>
          </h2>
      )}
    </div>
  );
}
