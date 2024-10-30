import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// Initialize Prisma Client for database access
const prisma = new PrismaClient();

// Function to format a date into a readable string
function formatDateForDisplay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function groupByBiMonthly(records) {
  const biMonthly = {}; // Object to store each month's records separately

  // Find the latest date in the payment records
  const latestDate = new Date(
    Math.max(...records.map(record => new Date(record.date)))
  );

  records.forEach((record) => {
    const date = new Date(record.date);
    const day = date.getUTCDate();
    const month = date.getUTCMonth(); // Month as a number (0–11)
    const year = date.getUTCFullYear();
    const monthKey = `${year}-${month + 1}`; // Unique key for each month in format "YYYY-MM"

    // Initialize each month's bi-monthly periods if not already set
    if (!biMonthly[monthKey]) {
      biMonthly[monthKey] = { "1-15": [], "16-31": [] };
    }

    // Group records into "1-15" or "16-31" for each month
    if (day <= 15) {
      biMonthly[monthKey]["1-15"].push({ 
        ...record, 
        period: `${date.toLocaleString('en-US', { month: 'long' })} 15, ${year}` 
      });
    } else {
      biMonthly[monthKey]["16-31"].push({ 
        ...record, 
        period: `${date.toLocaleString('en-US', { month: 'long' })} 30, ${year}` 
      });
    }
  });

  // Flag the last group as complete/incomplete based on the latest date
  return Object.entries(biMonthly).flatMap(([monthKey, periods], index, array) => {
    const month = monthKey.split('-')[1];
    const year = monthKey.split('-')[0];
    const isLastGroup = index === array.length - 1; // Only the last month might be incomplete

    return Object.entries(periods)
      .filter(([, recs]) => recs.length > 0) // Only include non-empty periods
      .map(([periodKey, recs]) => {
        const periodEndDate = new Date(
          periodKey === "1-15" 
            ? `${year}-${month}-15T23:59:59Z`
            : `${year}-${month}-30T23:59:59Z`
        );

        return {
          date: recs.length > 0 ? recs[0].period : "",
          payAmount: recs.reduce((sum, r) => sum + r.payAmount, 0),
          duration: recs.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
          status: "Unpaid",
          isComplete: isLastGroup ? periodEndDate <= latestDate : true, // Only the last period is checked against the latest date
        };
      });
  });
}

// Function to group records monthly (e.g., "October 30, 2024")
function groupByMonthly(records) {
  const monthly = {};

  // Find the latest date in the payment records
  const latestDate = new Date(
    Math.max(...records.map(record => new Date(record.date)))
  );

  records.forEach((record) => {
    const date = new Date(record.date);
    const month = date.getUTCMonth(); // Month as a number (0–11)
    const year = date.getUTCFullYear();
    const monthName = date.toLocaleString('en-US', { month: 'long' }); // Month name
    const key = `${year}-${month + 1}`; // Unique key for each month in format "YYYY-MM"

    if (!monthly[key]) {
      monthly[key] = {
        date: `${monthName} 30, ${year}`, // Label as "Month 30, Year"
        payAmount: 0,
        duration: 0,
        status: "Unpaid",
        periodEndDate: new Date(`${year}-${month + 1}-30T23:59:59Z`), // Assumed end of month (or 30th)
      };
    }

    monthly[key].payAmount += record.payAmount;
    monthly[key].duration += (record.dailySummary?.totalTime || 0) / 3600;
  });

  // Map monthly records to array and determine completeness
  return Object.values(monthly).map((period, index, array) => {
    const isLastMonth = index === array.length - 1; // Only check the last month dynamically

    return {
      ...period,
      isComplete: isLastMonth ? period.periodEndDate <= latestDate : true, // Check completeness for the last month only
    };
  });
}


// Function to filter and group records based on a custom date range
async function groupByManual(records, startDate, endDate) {
  const adjustedStartDate = new Date(startDate);
  adjustedStartDate.setDate(adjustedStartDate.getDate() + 1);

  const localStartDateStr = formatDateForDisplay(adjustedStartDate);
  const localEndDateStr = formatDateForDisplay(new Date(endDate));

  return [{
    date: `${localEndDateStr}`,
    payAmount: records.reduce((sum, r) => sum + r.payAmount, 0),
    duration: records.reduce((sum, r) => sum + ((r.dailySummary?.totalTime || 0) / 3600), 0),
    status: "Unpaid",
    isComplete: true, // Manual period completeness depends on the provided range only
  }];
}

// Main handler function to process the API request
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({ where: { employeeNo } });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { payoutMethod, payoutFrequency, dateRange } = req.body;
    const employeeId = employee.id;
    let groupedRecords = [];
    let paymentRecords;

    if (payoutMethod === 'Manual' && dateRange?.startDate && dateRange?.endDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.endDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setUTCHours(23, 59, 59, 999);

      paymentRecords = await prisma.paymentRecord.findMany({
        where: {
          employeeId,
          status: 'Unpaid',
          date: {
            gte: startDate,
            lte: endDate
          },
        },
        include: {
          dailySummary: {
            select: {
              totalTime: true,
            },
          },
        },
      });
      groupedRecords = await groupByManual(paymentRecords, startDate, endDate);

    } else if (payoutMethod === 'Automatic') {
      paymentRecords = await prisma.paymentRecord.findMany({
        where: {
          employeeId,
          status: 'Unpaid',
        },
        include: {
          dailySummary: {
            select: {
              totalTime: true,
            },
          },
        },
      });

      if (payoutFrequency === 'Daily') {
        groupedRecords = paymentRecords.map(record => ({
          date: formatDateForDisplay(record.date),
          payAmount: record.payAmount,
          duration: (record.dailySummary?.totalTime || 0) / 3600,
          status: record.status,
          isComplete: true,
        }));
      } else if (payoutFrequency === 'Bi-Monthly') {
        groupedRecords = groupByBiMonthly(paymentRecords);
      } else if (payoutFrequency === 'Monthly') {
        groupedRecords = groupByMonthly(paymentRecords);
      } else {
        return res.status(400).json({ message: 'Invalid payout frequency for Automatic' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid payout method or missing date range for Manual' });
    }

    return res.status(200).json({
      groupedRecords,
      paymentRecords,
    });
  } catch (error) {
    console.error('Error fetching payout records:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
