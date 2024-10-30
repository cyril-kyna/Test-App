import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const employeeNo = session?.user.employeeID;
  const { action } = req.body;

  if (!employeeNo) {
    return res.status(401).json({ message: 'Unauthorized, employee not found' });
  }

  if (req.method === 'POST') {
    try {
      const employee = await prisma.employee.findUnique({
        where: { employeeNo },
      });

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      const { action, logs } = req.body;
      const employeeId = employee.id;
      const currentTime = new Date(); // UTC by default
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Set to midnight UTC

      if (logs) {
        const validationResult = await validateAndProcessLogs(employeeId, logs);
        if (validationResult.error) {
          return res.status(400).json({ message: validationResult.message });
        }
        return res.status(201).json({ message: 'Logs imported successfully' });
      }

      // Get the latest entry for today
      const latestEntry = await prisma.timesheet.findFirst({
        where: {
          employeeID: employeeId,
          time: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { time: 'desc' },
      });

      let newEntry;

      if (action === 'TIME_IN') {
        if (latestEntry && latestEntry.type === 'TIME_OUT') {
          return res.status(400).json({ message: 'You cannot Time In after Time Out for today' });
        }

        newEntry = await prisma.timesheet.create({
          data: {
            type: 'TIME_IN',
            employeeID: employeeId,
            time: currentTime,
          },
        });

        await prisma.dailySummary.upsert({
          where: { employeeId_date: { employeeId, date: today } },
          update: {},
          create: {
            employeeId,
            date: today,
            totalTime: 0,
          },
        });

      } 
      else if (action === 'BREAK') {
        if (!latestEntry || latestEntry.type !== 'TIME_IN') {
          return res.status(400).json({ message: 'You must Time In before taking a Break' });
        }

        newEntry = await prisma.timesheet.create({
          data: {
            type: 'BREAK',
            employeeID: employeeId,
            time: currentTime,
          },
        });

        await calculateTotalTime(employeeId, today, currentTime, 'BREAK');

      } 
      else if (action === 'TIME_OUT') {
        if (!latestEntry || latestEntry.type !== 'TIME_IN') {
          return res.status(400).json({ message: 'You must Time In before Time Out' });
        }

        newEntry = await prisma.timesheet.create({
          data: {
            type: 'TIME_OUT',
            employeeID: employeeId,
            time: currentTime,
          },
        });

        await calculateTotalTime(employeeId, today, currentTime, 'TIME_OUT');
      } 
      else {
        return res.status(400).json({ message: 'Invalid action' });
      }

      return res.status(201).json({ message: `${action} logged`, timesheet: newEntry });
    } 
    catch (error) {
      console.error('Error logging timesheet:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } 
  else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Helper function to validate and process logs for import
async function validateAndProcessLogs(employeeId, logs) {
  console.log("Received logs:", logs);
  const processedLogs = logs.map(log => {
    let date = log.Date;
    
    // Check if the date is a string and contains slashes or dashes in non-YYYY-MM-DD format
    if (typeof date === 'string') {
      date = date.replace(/\//g, "-"); // Replace any slashes with dashes
  
      // Convert date format if it matches MM-DD-YYYY or DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [month, day, year] = date.split("-");
        date = `${year}-${month}-${day}`; // Reorder to YYYY-MM-DD
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Already in YYYY-MM-DD format, leave as is
      }
    }
  
    return {
      ...log,
      Date: date
    };
  });
  
  console.log("Processed logs:", processedLogs);
  const validActions = ["TIME_IN", "BREAK", "TIME_OUT"];
  const dailyLogs = {};

  for (const log of logs) {
    // Replace dateStr "/" with "-". 
    const { Date: dateStr, Type: type, Time: timeStr } = log;
    const formattedType = type.toUpperCase();
    
    if (!validActions.includes(formattedType)) {
      return { error: true, message: `Invalid type '${type}' in logs` };
    }
    const logDate = new Date(dateStr);
    const logTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(logDate) || isNaN(logTime)) {
      return { error: true, message: "Invalid date or time format" };
    }

    const existingSummary = await prisma.dailySummary.findUnique({
      where: { employeeId_date: { employeeId, date: logDate } }
    });
    if (existingSummary) {
      return { error: true, message: `Logs already exist for ${dateStr}` };
    }

    if (!dailyLogs[dateStr]) dailyLogs[dateStr] = [];
    dailyLogs[dateStr].push({ employeeID: employeeId, time: logTime, type: formattedType });
  }

  for (const [date, entries] of Object.entries(dailyLogs)) {
    let lastAction = null;
    // Sort entries by time to find first and last entries easily
    entries.sort((a, b) => a.time - b.time);

    for (const entry of entries) {
      if (lastAction === "TIME_OUT" && entry.type !== "TIME_IN") {
        return { error: true, message: `Incorrect ordering on ${date}` };
      }
      lastAction = entry.type;
    }
  }

  for (const [dateStr, entries] of Object.entries(dailyLogs)) {
    const logDate = new Date(dateStr);

    // Sort entries by time to get the first and last entry times
    entries.sort((a, b) => a.time - b.time);

    // Extract first and last entry times
    const firstEntryTime = entries[0].time;
    const lastEntryTime = entries[entries.length - 1].time;

    await prisma.timesheet.createMany({
      data: entries,
    });

    const totalTime = calculateTotalTimeForLogs(entries);

    await prisma.dailySummary.create({
      data: {
        employeeId,
        date: logDate,
        totalTime: totalTime,
        createdAt: firstEntryTime,
        updatedAt: lastEntryTime,
      },
    });
  }

  return { error: false };
}

// Helper function to calculate total time of an excel
function calculateTotalTimeForLogs(entries) {
  let totalTime = 0;
  let lastTimeIn = null;

  entries.forEach((entry) => {
    if (entry.type === 'TIME_IN') {
      lastTimeIn = entry.time;
    } else if (lastTimeIn && (entry.type === 'BREAK' || entry.type === 'TIME_OUT')) {
      totalTime += (entry.time - lastTimeIn) / 1000; // seconds
      lastTimeIn = null;
    }
  });

  return totalTime;
}

// Helper function to calculate total time and update daily summary
async function calculateTotalTime(employeeId, today, currentTime, actionType) {
  try {
    const timesheetEntries = await prisma.timesheet.findMany({
      where: {
        employeeID: employeeId,
        time: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { time: 'asc' },
    });

    let totalTime = 0;
    let lastTimeIn = null;

    timesheetEntries.forEach((entry) => {
      if (entry.type === 'TIME_IN') {
        lastTimeIn = new Date(entry.time);
      } else if (lastTimeIn && (entry.type === 'BREAK' || entry.type === 'TIME_OUT')) {
        totalTime += (new Date(entry.time) - lastTimeIn) / 1000;
        lastTimeIn = null;
      }
    });

    await prisma.dailySummary.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      update: {
        totalTime: totalTime,
      },
      create: {
        employeeId,
        date: today,
        totalTime: totalTime,
      },
    });

    return totalTime;
  } catch (error) {
    console.error(`Error calculating total time for ${actionType}:`, error);
    throw new Error('Error calculating total time');
  }
}
