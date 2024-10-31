// pages/api/timesheet/summary.js

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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Helper function to format time in a user-friendly format
function formatTimeForDisplay(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
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

// Helper function to fetch all daily summaries for an employee
async function getAllDailySummaries(employeeId) {
  return prisma.dailySummary.findMany({
    where: {
      employeeId,
    },
    orderBy: {
      date: 'desc',
    },
  });
}

// Helper function to get the start and end of the current day in UTC
function getLocalDateRange() {
  const now = new Date();

  // Start of today in local time at midnight
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  
  // End of today in local time just before midnight
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  console.log("Start of Today (Local):", startOfToday);
  console.log("End of Today (Local):", endOfToday);

  return { start: startOfToday, end: endOfToday };
}

// Helper function to fetch the latest action for today in local time
async function getLastActionToday(employeeId) {
  const { start, end } = getLocalDateRange();

  const latestTimesheetEntry = await prisma.timesheet.findFirst({
    where: {
      employeeID: employeeId,
      time: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { time: 'desc' },
    select: { type: true, time: true }, // Select time to log it
  });

  if (latestTimesheetEntry) {
    console.log("Latest Action:", latestTimesheetEntry.type);
    console.log("Action Timestamp:", latestTimesheetEntry.time);
  } else {
    console.log("No actions found for today.");
  }

  return latestTimesheetEntry ? latestTimesheetEntry.type : '';
}

// Main handler function
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const employeeNo = session.user.employeeID;
  const { page = 1, limit = 10, export: exportAll } = req.query; // Add export query parameter
  const skip = (page - 1) * limit;

  try {
    // Fetch employee details
    const employee = await getEmployeeDetails(employeeNo);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { id: employeeId, firstName, lastName } = employee;
    const fullName = `${firstName} ${lastName}`;

    // If export is true, fetch all daily summaries without pagination
    const dailySummaries = exportAll
      ? await getAllDailySummaries(employeeId) // Fetch all summaries for export
      : await prisma.dailySummary.findMany({
          where: { employeeId },
          orderBy: { date: 'desc' },
          skip,
          take: parseInt(limit), // Limit results if not exporting all
        });

    // Fetch the last action for today
    const lastAction = await getLastActionToday(employeeId);

    // If there are no daily summaries, respond accordingly
    if (dailySummaries.length === 0) {
      return res.status(200).json({
        lastAction: '', // No actions recorded yet
        dailySummaries: [],
      });
    }

    // Format summaries for the response
    const formattedSummaries = dailySummaries.map((summary) => ({
      fullName,
      date: formatDateForDisplay(summary.date),
      totalTime: formatTimeInHHMMSS(summary.totalTime),
      firstEntry: formatTimeForDisplay(summary.createdAt),
      lastEntry: formatTimeForDisplay(summary.updatedAt),
    }));

    // Get total summaries count for pagination if not exporting
    const totalSummaries = exportAll
      ? formattedSummaries.length
      : await prisma.dailySummary.count({
          where: { employeeId },
        });

    return res.status(200).json({
      lastAction,
      dailySummaries: formattedSummaries,
      totalPages: exportAll ? 1 : Math.ceil(totalSummaries / limit),
      currentPage: exportAll ? 1 : parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching timesheet summaries:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
