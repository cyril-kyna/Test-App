import { Playfair } from "next/font/google";
import '@uploadcare/react-uploader/core.css';

const playfair = Playfair({ 
  subsets: ['latin'] 
});

export default function About() {
  return (
    <div>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>About</h1>
    </div>
  )
}