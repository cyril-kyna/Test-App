import "@/styles/globals.css";
import NavBar from "@/components/ui/NavigationBar";
import Head from "next/head";
import { SessionProvider} from "next-auth/react";
import { ThemeProvider } from "@/components/ui/theme-provider";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
       <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <main className="mx-24 flex flex-col justify-center items-center">
          <Head>
            <title>Test</title> 
          </Head>
          <NavBar /> {/* Global Navigation Bar */}
          <Component {...pageProps} />
        </main>
        </ThemeProvider>
    </SessionProvider>
  );
}