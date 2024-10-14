import { useFormik } from 'formik'; 
import { Button } from '@/components/ui/button';
import { Playfair } from 'next/font/google';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";

const playfair = Playfair({
  subsets: ['latin'],
});

export default function Timesheet() {
  const { data: session, status } = useSession();
  const [lastAction, setLastAction] = useState(''); // Store last action (TIME_IN, BREAK, TIME_OUT)
  const [dailySummary, setDailySummary] = useState(null); // Store daily summary data
  const [loading, setLoading] = useState(true); // Track loading state

  // Fetch timesheet data to determine last action
  const fetchTimesheetData = useCallback(async () => {
    if (session) {
      const res = await fetch('/api/timesheet/summary');
      const data = await res.json();
      setLastAction(data.lastAction || ''); 
      setDailySummary(data.dailySummary || null); 
      setLoading(false); 
    }
  }, [session]);

  useEffect(() => {
    fetchTimesheetData();
  }, [session, fetchTimesheetData]);
  
  // Form handling for timesheet actions
  const formik = useFormik({
    initialValues: {
      action: '',
    },
    onSubmit: async (values) => {
      try {
        if (!session && status !== 'loading') {
          console.error("No session found");
          return;
        }
        const res = await fetch('/api/timesheet/insert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: values.action,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Failed to log timesheet', errorData);
          return;
        }

        // Refetch the timesheet data to update lastAction and daily summary (including total time)
        await fetchTimesheetData();
      } 
      catch (error) {
        console.error('Error submitting timesheet:', error);
      }
    },
  });

  // Button states based on last action
  const isTimeInDisabled = lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';

  // Handle initial state where no data exists
  const isInitialState = lastAction === '';

  if (loading) {
    return <p className="text-center text-[1.25rem] font-black mt-96">Loading Timesheets...</p>;
  }

  return (
    <div className='flex flex-col items-center gap-10'>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>
        Timesheet
      </h1>

      {/* Status Message */}
      {lastAction === 'TIME_OUT' ? (
        <p className='text-xl bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent'>
          You have accumulated <b>{dailySummary.totalTime}</b> total time for today.
        </p>
      ) : lastAction === 'BREAK' ? (
        <p className='text-xl bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent'>
          You have accumulated <b>{dailySummary.totalTime}</b> total time so far, Ready to continue?
        </p>
      ) : lastAction === 'TIME_IN' ? (
        <p className='text-xl bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent'>
          Your time is now running. Click <b>Break</b> if you want to pause, or <b>Time out</b> if you are done.
        </p>
      ) : 
        <p className='text-xl bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent'>
          Click <b>Time In</b> if you want to start.
        </p>
      }

      {/* Time In/Out/Break Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-row justify-center gap-5 bg-[var(--dark)] w-fit p-10 rounded-ss-xl rounded-ee-xl border-[1px] border-[var(--ten-opacity-white)]"
      >
        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded"
          onClick={async () => {
            await formik.setFieldValue('action', 'TIME_IN');
            formik.submitForm();
          }}
          disabled={!isInitialState && isTimeInDisabled} // Enable only if it's the initial state or allowed
        >
          Time In
        </Button>

        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded"
          onClick={async () => {
            await formik.setFieldValue('action', 'BREAK');
            formik.submitForm();
          }}
          disabled={isBreakDisabled} // Disable if the last action isn't TIME_IN
        >
          Break
        </Button>

        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded"
          onClick={async () => {
            await formik.setFieldValue('action', 'TIME_OUT');
            formik.submitForm();
          }}
          disabled={isTimeOutDisabled} // Disable if the last action is TIME_OUT or invalid
        >
          Time Out
        </Button>
      </form>

      {/* Daily Summary Table */}
      <div className='flex flex-col gap-3 mt-10'>
        <h1 className={`${playfair.className} ml-5 text-[var(--white)] text-[1.5rem] font-[900] uppercase`}>Summary:</h1>
        <div className="container mb-10 bg-[var(--dark)] p-5 border-[var(--ten-opacity-white)] rounded-ss-xl rounded-ee-xl border-[1px]">
          <Table className="min-w-[50rem]">
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time Span</TableHead>
            </TableRow>
            <TableBody>
              {dailySummary ? (
                <TableRow>
                  <TableCell>{dailySummary.fullName}</TableCell>
                  <TableCell>{dailySummary.date}</TableCell>
                  <TableCell>{dailySummary.totalTime}</TableCell>
                  <TableCell>{dailySummary.timeSpan}</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center pt-10 pb-5">
                    You have no records for today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}