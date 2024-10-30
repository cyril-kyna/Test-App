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
    timeZone: 'UTC',
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
function getUTCDateRange() {
  const now = new Date();
  
  // Start of today in UTC
  const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  
  // Start of tomorrow in UTC
  const startOfTomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  
  return { start: startOfTodayUTC, end: startOfTomorrowUTC };
}

// Helper function to fetch the latest action for today
async function getLastActionToday(employeeId) {
  const { start, end } = getUTCDateRange();
  
  const latestTimesheetEntry = await prisma.timesheet.findFirst({
    where: {
      employeeID: employeeId,
      time: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { time: 'desc' },
    select: { type: true },
  });

  return latestTimesheetEntry ? latestTimesheetEntry.type : '';
}

// Main handler function
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const employeeNo = session.user.employeeID;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    // Fetch employee details
    const employee = await getEmployeeDetails(employeeNo);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { id: employeeId, firstName, lastName } = employee;
    const fullName = `${firstName} ${lastName}`;

    // Fetch all daily summaries for the employee
    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        employeeId,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: parseInt(limit), // Limit results to the specified or default limit
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
      timeSpan: formatTimeForDisplay(summary.createdAt) + ' - ' + formatTimeForDisplay(summary.updatedAt),
    }));

    // Get total summaries count for pagination
    const totalSummaries = await prisma.dailySummary.count({
      where: { employeeId },
    });

    return res.status(200).json({
      lastAction,
      dailySummaries: formattedSummaries,
      totalPages: Math.ceil(totalSummaries / limit),
      currentPage: parseInt(page),
    });

  } catch (error) {
    console.error('Error fetching timesheet summaries:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
