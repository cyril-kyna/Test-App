import { useSession } from "next-auth/react";
import { PaymentChart } from "@/components/ui/payment-chart";
import { TimesheetTable } from "@/components/ui/timesheet-table";
import { PayrateCard } from "@/components/ui/payrate-card";

export default function Home() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  return (
    <div>
      {session ? (
          <div className="mb-40">
            <h1 className="mt-40 text-center text-[5rem] font-[900] uppercase">
              Welcome, {session.user.username}!
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: PayrateCard and PaymentChart in a flex container to ensure equal height */}
              <div className="flex flex-col gap-6">
                <PayrateCard className="min-w-[30rem] min-h-[12rem]" />
                <PaymentChart className="min-w-[30rem] min-h-[26rem]" />
              </div>
              {/* Column 2: TimesheetTable */}
              <div>
                <TimesheetTable className="h-full" />
              </div>
            </div>
          </div>
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
