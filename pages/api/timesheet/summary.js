import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

// Helper function to format time in HH:MM:SS format
function formatTimeInHHMMSS(totalTimeInSeconds) {
  const hours = Math.floor(totalTimeInSeconds / 3600);
  const minutes = Math.floor((totalTimeInSeconds % 3600) / 60);
  const seconds = totalTimeInSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper function to format date in a user-friendly format
function formatDateForDisplay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

// Helper function to format time in a user-friendly format
function formatTimeForDisplay(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

// Helper function to get the start of today (midnight)
function getStartOfToday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Midnight of today
  return today;
}

// Helper function to fetch employee details
async function getEmployeeDetails(employeeNo) {
  return prisma.employee.findUnique({
    where: { employeeNo },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}

// Helper function to fetch daily summary for today
async function getDailySummaryForToday(employeeId) {
  const today = getStartOfToday();
  return prisma.dailySummary.findFirst({
    where: {
      employeeId,
      date: today, // Filter for today's summary
    },
  });
}

// Helper function to fetch timesheet entries for today
async function getTimesheetEntriesForToday(employeeId) {
  const today = getStartOfToday();
  return prisma.timesheet.findMany({
    where: {
      employeeID: employeeId,
      time: {
        gte: today, // From the start of today
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Until the end of today
      },
    },
    orderBy: { time: 'asc' }, // Order by time ascending
  });
}

// Main handler function
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const employeeNo = session.user.employeeID;

  try {
    // Fetch employee details
    const employee = await getEmployeeDetails(employeeNo);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { id: employeeId, firstName, lastName } = employee;
    const fullName = `${firstName} ${lastName}`;

    // Fetch today's daily summary
    const dailySummary = await getDailySummaryForToday(employeeId);
    if (!dailySummary) {
      return res.status(404).json({ message: 'No timesheet record found for today.' });
    }

    const summaryDate = new Date(dailySummary.date);

    // Fetch today's timesheet entries
    const timesheetEntries = await getTimesheetEntriesForToday(employeeId);

    if (timesheetEntries.length === 0) {
      return res.status(200).json({
        lastAction: '',
        dailySummary: {
          fullName,
          totalTime: '00:00:00',
          date: formatDateForDisplay(summaryDate), // Format the date for display
          firstEntry: null,
          lastEntry: null,
        },
      });
    }

    // Get the first and last entry
    const firstEntry = timesheetEntries[0];
    const lastEntry = timesheetEntries[timesheetEntries.length - 1];

    // Format total time in HH:MM:SS
    const totalTimeFormatted = formatTimeInHHMMSS(dailySummary.totalTime);

    // Format the time span
    const formattedTimeIn = formatTimeForDisplay(firstEntry.time);
    const formattedTimeOut = lastEntry && lastEntry !== firstEntry ? formatTimeForDisplay(lastEntry.time) : null;

    // Respond with timesheet data
    return res.status(200).json({
      lastAction: lastEntry.type,
      dailySummary: {
        fullName,
        totalTime: totalTimeFormatted,
        timeIn: formattedTimeIn, // Format timeIn for display
        timeOut: formattedTimeOut, // Format timeOut for display
        timeSpan: formattedTimeOut ? `${formattedTimeIn} to ${formattedTimeOut}` : formattedTimeIn, // Full time span
        date: formatDateForDisplay(summaryDate), // Format the date for display
      },
    });

  } catch (error) {
    console.error('Error fetching timesheet summary:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}