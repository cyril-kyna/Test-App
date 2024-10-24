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
  const [dailySummaries, setDailySummaries] = useState([]); // Store array of daily summaries
  const [loading, setLoading] = useState(true); // Track loading state
  // Individual loading states for each button
  const [isTimeInLoading, setIsTimeInLoading] = useState(false);
  const [isBreakLoading, setIsBreakLoading] = useState(false);
  const [isTimeOutLoading, setIsTimeOutLoading] = useState(false);

  // Fetch timesheet data to determine last action and daily summaries
  const fetchTimesheetData = useCallback(async () => {
    if (session) {
      try {
        const res = await fetch('/api/timesheet/summary');
        if (!res.ok) {
          throw new Error('Failed to fetch timesheet summary');
        }
        const data = await res.json();
        setLastAction(data.lastAction || ''); 
        setDailySummaries(data.dailySummaries || []); 
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
      } finally {
        setLoading(false); 
      }
    }
  }, [session]);

  useEffect(() => {
    fetchTimesheetData();
  }, [session, fetchTimesheetData]);

  // Convert UTC time span string (e.g., "04:34 AM to 04:35 AM" or "04:34 AM") to local time
  function convertTimeSpanToLocal(timeSpan) {
    if (!timeSpan) return '';

    // Check if the timeSpan includes ' to ' indicating a range
    if (timeSpan.includes(' to ')) {
      const [startTimeUTC, endTimeUTC] = timeSpan.split(' to ').map(time => time.trim());

      // If start and end times are the same, return only one time
      if (startTimeUTC === endTimeUTC) {
        const localTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}Z`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return localTime;
      }

      // Convert start time from UTC to the user's local time
      const localStartTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}Z`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Convert end time from UTC to the user's local time
      const localEndTime = new Date(`1970-01-01T${convertTo24HourFormat(endTimeUTC)}Z`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Return the local time span as a string (start to end)
      return `${localStartTime} to ${localEndTime}`;
    } else {
      // Only one time present, convert and return it
      const localTime = new Date(`1970-01-01T${convertTo24HourFormat(timeSpan)}Z`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return localTime;
    }
  }

  // Helper function to convert 12-hour format (e.g., "04:34 AM") to 24-hour format for Date parsing
  function convertTo24HourFormat(timeString) {
    if (!timeString || !timeString.includes(' ')) {
      console.error("Invalid time format:", timeString);
      return "00:00:00"; // Return default value in case of invalid format
    }

    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours < 12) {
      hours += 12; // Convert PM times
    } else if (period === 'AM' && hours === 12) {
      hours = 0; // Handle midnight case
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }

  // Convert UTC date string (e.g., "Mon, Oct 14, 2024") to local date
  function convertDateToLocal(utcDateString) {
    const utcDate = new Date(utcDateString + ' UTC'); // Add 'UTC' to parse correctly
    return utcDate.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

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

        // Refetch the timesheet data to update lastAction and daily summaries (including total time)
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
          You have accumulated <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> total time for today.
        </p>
      ) : lastAction === 'BREAK' ? (
        <p className='text-xl bg-[linear-gradient(90deg,_var(--rainbow1)_0%,_var(--rainbow2)_20%,_var(--rainbow3)_40%,_var(--rainbow4)_60%,_var(--rainbow5)_80%,_var(--rainbow6)_100%)] bg-clip-text text-transparent'>
          You have accumulated <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> total time so far, Ready to continue?
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
        className="flex flex-row justify-center gap-5 bg-background w-fit p-10 rounded-xl border-[1px] border-zinc-700"
      >
        <Button
          type="button"
          className="min-w-28"
          onClick={async () => {
            setIsTimeInLoading(true); // Set loading state
            await formik.setFieldValue('action', 'TIME_IN');
            await formik.submitForm();
            setIsTimeInLoading(false); // Reset loading state
          }}
          disabled={isTimeInLoading || (!isInitialState && isTimeInDisabled)}
        >
          {isTimeInLoading ? 'Loading...' : 'Time In'}
        </Button>

        <Button
          type="button"
          className="min-w-28"
          onClick={async () => {
            setIsBreakLoading(true); // Set loading state
            await formik.setFieldValue('action', 'BREAK');
            await formik.submitForm();
            setIsBreakLoading(false); // Reset loading state
          }}
          disabled={isBreakLoading || isBreakDisabled}
        >
          {isBreakLoading ? 'Loading...' : 'Break'}
        </Button>

        <Button
          type="button"
          className="min-w-28"
          onClick={async () => {
            setIsTimeOutLoading(true); // Set loading state
            await formik.setFieldValue('action', 'TIME_OUT');
            await formik.submitForm();
            setIsTimeOutLoading(false); // Reset loading state
          }}
          disabled={isTimeOutLoading || isTimeOutDisabled}
        >
          {isTimeOutLoading ? 'Loading...' : 'Time Out'}
        </Button>
      </form>

      {/* Daily Summaries Table */}
      <div className='flex flex-col gap-3 mt-10'>
        <h1 className={`${playfair.className} ml-5 text-[var(--white)] text-[1.5rem] font-[900] uppercase`}>Summary:</h1>
        <div className="container mb-10 bg-background p-5 border-zinc-700 rounded-xl border-[1px]">
          <Table className="min-w-[50rem]">
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time Span</TableHead>
            </TableRow>
            <TableBody>
              {dailySummaries.length > 0 ? (
                dailySummaries.map((summary, index) => (
                  <TableRow key={index}>
                    <TableCell>{summary.fullName}</TableCell>
                    <TableCell>{convertDateToLocal(summary.date)}</TableCell> {/* Convert date to local time */}
                    <TableCell>{summary.totalTime}</TableCell>
                    <TableCell>{convertTimeSpanToLocal(summary.timeSpan)}</TableCell> {/* Convert time span to local time */}
                  </TableRow>
                ))
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
