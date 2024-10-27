import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  return (
    <div>
      {session ? (
          <h1 className="mt-40 text-center text-[5rem] font-[900] uppercase">
            Welcome,
            <br></br> 
            <p>
              {session.user.username}!
            </p>
          </h1>
      ) : (
          <h2 className="mt-40 text-center text-[5rem] font-[900] uppercase">
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
