import { Formik, Form, Field } from 'formik';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";

export default function Timesheet() {
  const { data: session, status } = useSession();
  const [lastAction, setLastAction] = useState(''); // Store last action (TIME_IN, BREAK, TIME_OUT)
  const [dailySummaries, setDailySummaries] = useState([]); // Store array of daily summaries
  const [loading, setLoading] = useState(true); // Track loading state
  const [buttonLoading, setButtonLoading] = useState(''); // Track which button is loading

  // Fetch timesheet data to determine last action and daily summaries
  const fetchTimesheetData = useCallback(async () => {
    if (session) {
      try {
        const res = await fetch('/api/timesheet/get-summary');
        if (!res.ok) {
          throw new Error('Failed to fetch timesheet summary');
        }
        const data = await res.json();
        setLastAction(data.lastAction || '');
        setDailySummaries(data.dailySummaries || []);
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
      } 
      finally {
        setTimeout(() => setLoading(false), 1000);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchTimesheetData();
  }, [session, fetchTimesheetData]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!session && status !== 'loading') {
        console.error("No session found");
        return;
      }

      setButtonLoading(values.action); // Show loading state on the current action button
      const res = await fetch('/api/timesheet/insert-timesheet', {
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
      resetForm();
    } 
    catch (error) {
      console.error('Error submitting timesheet:', error);
    } 
    finally {
      setSubmitting(false);
      setButtonLoading(''); // Reset loading state
    }
  };

  const isTimeInDisabled = lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <p className="text-white text-2xl font-bold">Loading Timesheet...</p>
      </div>
    );
  }
  return (
    <div className='flex flex-col items-center gap-5'>
      <h1 className="mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase">
        Timesheet
      </h1>

      {/* Status Message */}
      {lastAction === 'TIME_OUT' ? (
        <p className='text-xl text-primary'>
          You have accumulated <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> total time for today.
        </p>
      ) : lastAction === 'BREAK' ? (
        <p className='text-primary'>
          You have accumulated <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> total time so far, Ready to continue?
        </p>
      ) : lastAction === 'TIME_IN' ? (
        <p className='text-xl text-primary'>
          Your time is now running. Click <b>Break</b> if you want to pause, or <b>Time out</b> if you are done.
        </p>
      ) : 
        <p className='text-xl text-primary'>
          Click <b>Time In</b> if you want to start.
        </p>
      }

      {/* Time In/Out/Break Form */}
      <Formik
        initialValues={{ action: '' }}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue }) => (
          <Form className="flex flex-row justify-center gap-5 bg-background w-fit p-10 rounded-xl border-[1px] border-zinc-700">
            <Button
              type="button"
              className="min-w-28"
              onClick={() => {
                setFieldValue('action', 'TIME_IN');
                setButtonLoading('TIME_IN');
                handleSubmit({ action: 'TIME_IN' }, { setSubmitting: () => {}, resetForm: () => {} });
              }}
              disabled={buttonLoading === 'TIME_IN' || isTimeInDisabled}
            >
              {buttonLoading === 'TIME_IN' ? 'Loading...' : 'Time In'}
            </Button>

            <Button
              type="button"
              className="min-w-28"
              onClick={() => {
                setFieldValue('action', 'BREAK');
                setButtonLoading('BREAK');
                handleSubmit({ action: 'BREAK' }, { setSubmitting: () => {}, resetForm: () => {} });
              }}
              disabled={buttonLoading === 'BREAK' || isBreakDisabled}
            >
              {buttonLoading === 'BREAK' ? 'Loading...' : 'Break'}
            </Button>

            <Button
              type="button"
              className="min-w-28"
              onClick={() => {
                setFieldValue('action', 'TIME_OUT');
                setButtonLoading('TIME_OUT');
                handleSubmit({ action: 'TIME_OUT' }, { setSubmitting: () => {}, resetForm: () => {} });
              }}
              disabled={buttonLoading === 'TIME_OUT' || isTimeOutDisabled}
            >
              {buttonLoading === 'TIME_OUT' ? 'Loading...' : 'Time Out'}
            </Button>
          </Form>
        )}
      </Formik>

      {/* Daily Summaries Table */}
      <div className='flex flex-col gap-2 mt-10 mb-40'>
        <h1 className="text-[1.5rem] font-[900] uppercase">Your Daily Summary:</h1>
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
                    <TableCell>{summary.date}</TableCell> {/* Convert date to local time */}
                    <TableCell>{summary.totalTime}</TableCell>
                    <TableCell>{summary.timeSpan}</TableCell> {/* Convert time span to local time */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    You have no records.
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
