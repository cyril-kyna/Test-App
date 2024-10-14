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
            <p className="bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent">
              {session.user.username}!
            </p>
          </h1>
      ) : (
          <h2 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>
            Welcome,
            <br></br> 
            <p className="bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent">
              Random User
            </p>
          </h2>
      )}
    </div>
  );
}
