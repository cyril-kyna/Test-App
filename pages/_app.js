import "@/styles/globals.css";
import { GeistSans } from 'geist/font/sans';
import NavBar from "@/components/ui/NavigationBar";
import Head from "next/head";
import { SessionProvider} from "next-auth/react";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <main className={`${GeistSans.className} mx-24 flex flex-col justify-center items-center`}>
        <Head>
          <title>Test</title> 
        </Head>
        <NavBar /> {/* Global Navigation Bar */}
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}