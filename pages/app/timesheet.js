import { Formik, Form } from 'formik';
import { Button } from '@/components/ui/button';
import ExcelUploader from '@/components/ui/excel-uploader';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import * as XLSX from 'xlsx';
import { Skeleton } from '@/components/ui/skeleton';

export default function Timesheet() {
  const { data: session, status } = useSession();
  const [lastAction, setLastAction] = useState(''); // Store last action (TIME_IN, BREAK, TIME_OUT)
  const [dailySummaries, setDailySummaries] = useState([]); // Store array of daily summaries
  const [loading, setLoading] = useState(true); // Track loading state
  const [buttonLoading, setButtonLoading] = useState(''); // Track which button is loading
  const [disableButtons, setDisableButtons] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false); // Track page loading state for pagination
  const [importSuccessMessage, setImportSuccessMessage] = useState(''); 

  // Fetch timesheet data to determine last action and daily summaries
  const fetchTimesheetData = useCallback(async (page = 1) => {
    if (session) {
      setIsPageLoading(true); // Start loading state for page fetch
      try {
        const res = await fetch(`/api/timesheet/get-summary?page=${page}`);
        if (!res.ok) {
          throw new Error('Failed to fetch timesheet summary');
        }
        const data = await res.json();
        setLastAction(data.lastAction || '');
        setDailySummaries(data.dailySummaries || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
      } finally {
        setLoading(false);
        setIsPageLoading(false); // End loading state for page fetch
      }
    }
  }, [session]);

  useEffect(() => {
    fetchTimesheetData(currentPage);
  }, [session, fetchTimesheetData, currentPage]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!session && status !== 'loading') {
        console.error("No session found");
        return;
      }

      setButtonLoading(values.action);
      const res = await fetch('/api/timesheet/insert-timesheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: values.action }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to log timesheet', errorData);
        return;
      }

      await fetchTimesheetData(currentPage);
      resetForm();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
    } finally {
      setSubmitting(false);
      setButtonLoading('');
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(dailySummaries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");
    XLSX.writeFile(workbook, "timesheet.xlsx");
  };

  const onImportSuccess = async (isTodayIncluded) => {
    setImportSuccessMessage('Logs imported successfully!');
    if (isTodayIncluded) {
      setDisableButtons(true);
    }
    // Refetch data instead of reloading the page
    await fetchTimesheetData(currentPage);

    // Optional: Clear success message after a few seconds
    setTimeout(() => setImportSuccessMessage(''), 3000);
  };  

  const handlePageChange = (page) => {
    if (!isPageLoading) { // Prevent page change while loading
      setCurrentPage(page);
    }
  };

  const isTimeInDisabled = disableButtons || lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = disableButtons || lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = disableButtons || lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';
  
  const formatTimeSpan = (timespan) => {
    // Split the timespan into start and end times
    const [startTime, endTime] = timespan.split(' - ');
  
    // Helper function to parse time strings into Date objects
    const parseTimeToDate = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
  
      // Convert to 24-hour format
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
  
      // Create a new Date object with today's date and the parsed time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
  
    // Parse start and end times
    const startDate = parseTimeToDate(startTime);
    const endDate = parseTimeToDate(endTime);
  
    // Format options for toLocaleTimeString
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
  
    // Convert times to local time strings
    const startLocalTime = startDate.toLocaleTimeString(undefined, options);
    const endLocalTime = endDate.toLocaleTimeString(undefined, options);
  
    // Combine the converted times
    return `${startLocalTime} - ${endLocalTime}`;
  };
  
  return (
    <div className='flex flex-col items-center gap-5'>
      <h1 className="mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase">
        Timesheet
      </h1>
      {/* Success Message */}
      {importSuccessMessage && (
        <p className="text-primary text-lg">{importSuccessMessage}</p>
      )}
      {/* Import and Export Buttons */}
      <p className='text-center'>
        For Log Uploads, Ensure your Excel file has columns for:<br/>
        Date MM/DD/YYYY, Type TIME_IN, BREAK, TIME_OUT, and Time HH,<br/>
      </p>
      <div className="flex flex-col gap-4 mb-4">
        <ExcelUploader onImportSuccess={onImportSuccess} />
        <Button onClick={handleExport} className="min-w-28">
          Export Your Timesheet
        </Button>
      </div>

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
      ) : (
        <p className='text-xl text-primary'>
          Click <b>Time In</b> if you want to start.
        </p>
      )}

      {/* Time In/Out/Break Form */}
      <Formik initialValues={{ action: '' }} onSubmit={handleSubmit}>
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

      {/* Daily Summaries Table with Skeleton Loading */}
      <div className='flex flex-col gap-2 mt-10 mb-40'>
        <h1 className="text-[1.5rem] font-[900] uppercase">Your Daily Summary:</h1>
        <div className="container mb-10 bg-background p-5 border-zinc-700 rounded-xl border-[1px]">
          {isPageLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-[50rem] mb-2 rounded" />
            ))
          ) : (
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
                      <TableCell>{summary.date}</TableCell>
                      <TableCell>{summary.totalTime}</TableCell>
                      <TableCell>{formatTimeSpan(summary.timeSpan)}</TableCell>
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
          )}
        </div>

        {/* Pagination Component */}
        <Pagination className="mt-4">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} disabled={isPageLoading}>
                Previous
              </PaginationPrevious>
            )}
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  disabled={isPageLoading}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            {currentPage < totalPages && (
              <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={isPageLoading}>
                Next
              </PaginationNext>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
