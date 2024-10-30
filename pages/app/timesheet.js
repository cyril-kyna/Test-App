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
  const [buttonLoading, setButtonLoading] = useState(''); // Track which button is loading
  const [disableButtons, setDisableButtons] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false); // Track page loading state for pagination
  const [importSuccessMessage, setImportSuccessMessage] = useState(''); 
  const [mounted, setMounted] = useState(false);

  // Fetch timesheet data to determine last action and daily summaries
  const fetchTimesheetData = useCallback(async (page = 1) => {
    if (session) {
      setIsPageLoading(true);
      try {
        const res = await fetch(`/api/timesheet/get-summary?page=${page}`);
        if (!res.ok) throw new Error('Failed to fetch timesheet summary');
  
        const data = await res.json();
        setLastAction(data.lastAction || '');
        setDailySummaries(data.dailySummaries || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setDataFetched(true); // Mark as fetched
      } 
      catch (error) {
        console.error('Error fetching timesheet data:', error);
      } 
      finally {
        setIsPageLoading(false);
      }
    }
  }, [session]);
  useEffect(() => {
    fetchTimesheetData(currentPage);
    setMounted(true);
  }, [session, fetchTimesheetData, currentPage]);
  
  if (!mounted) {
    // Return null or a loading indicator to prevent hydration issues
    return null;
  }

  const handlePageChange = (page) => {
    if (!isPageLoading) { // Prevent page change while loading
      setCurrentPage(page);
    }
  };

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

  const handleExport = async () => {
    // Fetch all summaries specifically for export
    try {
      const res = await fetch(`/api/timesheet/get-summary?export=true`); // Add a query parameter to request all data for export
      if (!res.ok) throw new Error('Failed to fetch all timesheet summaries for export');

      const exportData = await res.json();
      const fullSummaries = exportData.dailySummaries || [];

      // Convert all data to a sheet and export
      const worksheet = XLSX.utils.json_to_sheet(fullSummaries);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Full_Timesheet");
      XLSX.writeFile(workbook, "daily_summary_records.xlsx");
    } catch (error) {
      console.error('Error exporting full timesheet data:', error);
    }
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

  const isTimeInDisabled = disableButtons || lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = disableButtons || lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = disableButtons || lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';

  return (
    <div className='flex flex-col mt-40 mb-40 items-left gap-10'>
      <h1 className="text-[5rem] font-[900] uppercase">
        Timesheet
      </h1>
      <div className='flex flex-row gap-20'>
        <div className='flex flex-col gap-5 min-w-[43rem]'>
          {/* Import and Export Buttons */}
          <div className="flex flex-col gap-4 min-w-[15rem]">
            {/* Success Message */}
            {importSuccessMessage && (
              <p className="text-primary text-lg">{importSuccessMessage}</p>
            )}
            <p className='text-left'>
              For Timesheet Log Uploads, Ensure your Excel file has columns for:<br/>
              Date MM/DD/YYYY, Type TIME_IN, BREAK, TIME_OUT, and Time HH,<br/>
            </p>
            <ExcelUploader onImportSuccess={onImportSuccess} className="min-w-[15rem]"/>
            <Button variant="outline" onClick={handleExport} className="min-w-[15rem] border-2 border-dashed p-8 text-muted-foreground">
              Export you Daily Summary
            </Button>
          </div>
          {/* Timesheet Actions Form */}
          <Formik initialValues={{ action: '' }} onSubmit={handleSubmit}>
            {({ setFieldValue }) => (
              <Form className="flex flex-col justify-center items-center gap-5 bg-card p-10 rounded-xl border-[1px] border-zinc-700">
                {/* Timesheet Status Message */}
                {lastAction === 'TIME_OUT' ? (
                  <p className='text-primary'>
                    You have accumulated <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> total time for today.
                  </p>
                ) : lastAction === 'BREAK' ? (
                  <p className='text-primary'>
                    You have accumulated <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> total time so far, Ready to continue?
                  </p>
                ) : lastAction === 'TIME_IN' ? (
                  <p className='text-primary'>
                    Your time is now running. Click <b>Break</b> if you want to pause, or <b>Time out</b> if you are done.
                  </p>
                ) : (
                  <p className='text-primary'>
                    Click <b>Time In</b> if you want to start.
                  </p>
                )}
                <div className='flex flex-row gap-5'>
                  {/* Time In */}
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
                  {/* Break */}
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
                  {/* Break */}
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
                </div>
              </Form>
            )}
          </Formik>
        </div>
        {/* Daily Summaries Table with Skeleton Loading */}
        <div className='flex flex-col gap-2 min-h-[37rem]'>
          <h1 className="text-[1.5rem] font-[900] uppercase">Your Daily Summary:</h1>
          <div className="container h-full bg-card p-5 border-zinc-700 rounded-xl border-[1px]">
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
                        <TableCell>{summary.timeSpan}</TableCell>
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
                <PaginationPrevious className="cursor-pointer" onClick={() => handlePageChange(currentPage - 1)} disabled={isPageLoading}>
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
                <PaginationNext className="cursor-pointer" onClick={() => handlePageChange(currentPage + 1)} disabled={isPageLoading}>
                  Next
                </PaginationNext>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
