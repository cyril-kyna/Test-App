import { useState } from 'react';
import { useSession } from "next-auth/react";
import EmployeeNavbar from './components/employee-nav-bar.js'; 

export default function Employee() {
  // State to handle form submission and button disable logic
  const { data: session } = useSession();
  return (
    <div className="flex flex-col gap-10 mt-28">
      <div className="flex flex-col items-start">
        <h1 className="text-[var(--white)] text-center text-[5rem] font-[900] uppercase">
          Employee
        </h1>
        <p className="text-[var(--grey-white)] text-center text-[1.5rem] font-[900] uppercase">
          Employee Name: <u> {session ? `${session.user.firstName} ${session.user.lastName}` : "Guest"} </u>
        </p>
      </div>
      <div className="flex flex-col gap-5 bg-background min-w-[60rem] min-h-[30rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
        <EmployeeNavbar/>
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-7">
            <h1 className="text-[var(--grey-white)] text-left text-xl font-semibold text-balance">
              Set payout schedule.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
