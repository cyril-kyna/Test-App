import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

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

// Helper function to format a date range
function formatWeekRange(startDate, endDate) {
  const startOptions = { month: 'short', day: 'numeric' };
  const endOptions = { month: 'short', day: 'numeric' };

  const start = new Date(startDate).toLocaleDateString('en-US', startOptions);
  const end = new Date(endDate).toLocaleDateString('en-US', endOptions);

  return `${start} to ${end}`;
}

// Helper function to get the Monday of the week for a given date
function getMonday(d) {
  d = new Date(d);
  const day = d.getUTCDay(); // Use getUTCDay() for consistency with UTC
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  d.setUTCDate(diff);
  return d;
}

function groupByWeek(records) {
  if (records.length === 0) return [];

  // Sort the records by date in ascending order
  records.sort((a, b) => new Date(a.date) - new Date(b.date));

  const weeks = [];
  let currentWeek = [];
  let currentMonday = getMonday(new Date(records[0].date)); // Start with the first Monday
  let currentSunday = new Date(currentMonday);
  currentSunday.setUTCDate(currentMonday.getUTCDate() + 6); // Set to the next Sunday

  records.forEach((record) => {
    const recordDate = new Date(record.date);

    // Check if the record's date is within the current week
    if (recordDate >= currentMonday && recordDate <= currentSunday) {
      currentWeek.push(record);
    } else {
      // Push the current week data if not empty
      if (currentWeek.length > 0) {
        weeks.push({
          date: formatWeekRange(currentMonday, currentSunday),
          payAmount: currentWeek.reduce((sum, r) => sum + r.payAmount, 0),
          duration: currentWeek.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
          startDate: new Date(currentMonday), // Add start date for sorting
        });
      }

      // Reset the week to the new Monday
      currentMonday = getMonday(recordDate);
      currentSunday = new Date(currentMonday);
      currentSunday.setUTCDate(currentMonday.getUTCDate() + 6);

      // Start a new week
      currentWeek = [record];
    }
  });

  // Push the last week if it has any records
  if (currentWeek.length > 0) {
    weeks.push({
      date: formatWeekRange(currentMonday, currentSunday),
      payAmount: currentWeek.reduce((sum, r) => sum + r.payAmount, 0),
      duration: currentWeek.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
      startDate: new Date(currentMonday), // Add start date for sorting
    });
  }

  // Sort the weeks in descending order based on startDate
  weeks.sort((a, b) => b.startDate - a.startDate);

  // Remove startDate from the week objects if not needed
  weeks.forEach((week) => delete week.startDate);

  return weeks;
}

// Helper function to group records by month
function groupByMonth(records) {
  const months = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const month = date.getUTCMonth(); // 0-11
    const year = date.getUTCFullYear();
    const key = `${year}-${month + 1}`;
    const monthName = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
    const sortKey = year * 100 + (month + 1);

    if (!months[key]) {
      months[key] = {
        date: `${monthName} ${year}`,
        payAmount: 0,
        duration: 0,
        sortKey,
      };
    }
    months[key].payAmount += record.payAmount;
    months[key].duration += (record.dailySummary?.totalTime || 0) / 3600;
  });

  // Convert months object to array and sort
  const result = Object.values(months);
  result.sort((a, b) => b.sortKey - a.sortKey);

  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({
      where: { employeeNo },
      include: {
        payRate: {
          select: {
            payRate: true,
            payRateSchedule: true,
            effectiveDate: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { filter } = req.query;
    const employeeId = employee.id;
    const { payRate, payRateSchedule, effectiveDate } = employee.payRate || {};

    const paymentRecords = await prisma.paymentRecord.findMany({
      where: {
        employeeId,
      },
      include: {
        dailySummary: {
          select: {
            totalTime: true,
          },
        },
      },
    });

    let groupedRecords = [];

    if (filter === 'daily') {
      groupedRecords = paymentRecords
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((record) => ({
          date: formatDateForDisplay(record.date),
          payAmount: record.payAmount,
          duration: (record.dailySummary?.totalTime || 0) / 3600,
        }));
    } else if (filter === 'weekly') {
      groupedRecords = groupByWeek(paymentRecords);
    } else if (filter === 'monthly') {
      groupedRecords = groupByMonth(paymentRecords);
    } else {
      groupedRecords = paymentRecords
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((record) => ({
          date: formatDateForDisplay(record.date),
          payAmount: record.payAmount,
          duration: (record.dailySummary?.totalTime || 0) / 3600,
        }));
    }

    // Return response with payRate details and grouped records separately
    return res.status(200).json({
      payRate,
      payRateSchedule,
      effectiveDate,
      groupedRecords,
    });
  } catch (error) {
    console.error('Error fetching payment records:', error);
    return res.status(400).json({ message: error.message });
  }
}
