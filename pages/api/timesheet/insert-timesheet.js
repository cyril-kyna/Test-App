import { PrismaClient } from '@prisma/client';
import { getEmployeeId } from '@/lib/helpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  try {
    const employeeId = await getEmployeeId(req, res);
    const { action, logs } = req.body;
    // Check if request is a Timesheet Excel Log or Normal Timesheet Actions
    if (logs) {
      // Treat logs as a batch request
      const result = await validateAndProcessLogs(employeeId, logs);
      if (result.error) return res.status(400).json({ message: result.message });
      return res.status(201).json({ message: 'Logs imported successfully' });
    }
    else if (action) {
      // Treat action as a single entry
      const now = new Date();
      const localDate = now.toLocaleDateString('en-CA');
      const localTime = now.toLocaleTimeString('en-GB', { hour12: false });
      const timesheetAction = [{ Type: action, Date: localDate, Time: localTime }];
      const result = await processEntries(employeeId, timesheetAction);
      if (result.error) return res.status(400).json({ message: result.message });
      return res.status(201).json({ message: `${action} logged successfully` });
    } 
    else {
      return res.status(400).json({ message: 'Invalid request: either logs or action is required' });
    }
  } 
  catch (error) {
    console.error('Error handling timesheet request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function validateAndProcessLogs(employeeId, logs) {
  console.log("Received logs:", logs);

  const processedLogs = logs.map(log => {
    let date = log.Date;
    let time = log.Time;
  
    // **Process the date**
    if (typeof date === 'number') {
      // **Convert serial date number to YYYY-MM-DD**
      const excelEpoch = new Date(1899, 11, 30); // Excel's epoch start
      date = new Date(excelEpoch.getTime() + date * 86400000); // Add days in milliseconds
  
      // Format date as YYYY-MM-DD
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
    } else if (typeof date === 'string') {
      // Replace any slashes with dashes
      date = date.replace(/\//g, "-");
  
      // Convert date format if it matches MM-DD-YYYY or DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [part1, part2, year] = date.split("-");
        // Decide if it's MM-DD-YYYY or DD-MM-YYYY based on your locale
        // For this example, let's assume MM-DD-YYYY
        date = `${year}-${part1}-${part2}`; // Reorder to YYYY-MM-DD
      }
      // Leave YYYY-MM-DD format as is
    }
  
    // **Process the time**
    if (typeof time === 'number') {
      // **Convert the fractional day to a time string**
      const totalSeconds = Math.round(time * 24 * 60 * 60);
      let hours = Math.floor(totalSeconds / 3600) % 24;
      let minutes = Math.floor((totalSeconds % 3600) / 60);
      let seconds = totalSeconds % 60;
  
      // Pad hours, minutes, and seconds with leading zeros
      const hoursStr = String(hours).padStart(2, '0');
      const minutesStr = String(minutes).padStart(2, '0');
      const secondsStr = String(seconds).padStart(2, '0');
  
      time = `${hoursStr}:${minutesStr}:${secondsStr}`;
    } else if (typeof time === 'string') {
      // **Handle time strings with AM/PM notation**
      const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/;
      const match = time.match(timeRegex);
      if (match) {
        let [_, hourStr, minuteStr, secondStr = '00', meridiem] = match;
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const second = parseInt(secondStr, 10);
  
        if (meridiem) {
          meridiem = meridiem.toUpperCase();
          if (meridiem === 'PM' && hour < 12) {
            hour += 12;
          } else if (meridiem === 'AM' && hour === 12) {
            hour = 0;
          }
        }
  
        // Pad with leading zeros
        const hoursStr = String(hour).padStart(2, '0');
        const minutesStr = String(minute).padStart(2, '0');
        const secondsStr = String(second).padStart(2, '0');
  
        time = `${hoursStr}:${minutesStr}:${secondsStr}`;
      } else {
        // Time string is in an unexpected format
        console.warn(`Unrecognized time format: ${time}`);
      }
    } else {
      // Time is neither a number nor a string
      console.warn(`Invalid time value: ${time}`);
    }
  
    return {
      ...log,
      Date: date,
      Time: time,
    };
  });
  
  console.log("Processed logs:", processedLogs);
  const validActions = ["TIME_IN", "BREAK", "TIME_OUT"];
  const dailyLogs = {};

  for (const log of processedLogs) {
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

    // Check that the first action is TIME_IN
    if (entries.length > 0 && entries[0].type !== "TIME_IN") {
        return { error: true, message: `First action must be TIME_IN` };
    }

    for (const entry of entries) {
        // Check if the last action is TIME_OUT and the current action is not TIME_IN
        if (lastAction === "TIME_OUT" && entry.type !== "TIME_IN") {
            return { error: true, message: `Incorrect ordering: TIME_OUT cannot be followed by ${entry.type}` };
        }

        // Check for consecutive BREAK actions
        if (lastAction === "BREAK" && entry.type === "BREAK") {
            return { error: true, message: `Incorrect ordering: Consecutive BREAK actions not allowed` };
        }

        // Update the last action
        lastAction = entry.type;
    }

    // Check that the last action is TIME_OUT
    if (lastAction !== "TIME_OUT") {
        return { error: true, message: `Last action must be TIME_OUT` };
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

// Function to process single action entries
async function processEntries(employeeId, entries) {
  // Entries is an array with a single action
  const entry = entries[0];

  // Convert the entry into processed format with UTC timestamp
  const processedEntry = {
    type: entry.Type.toUpperCase(),
    time: new Date(`${entry.Date}T${entry.Time}`).toISOString(), // Ensure time is in UTC format
    employeeID: employeeId,
  };

  // Validate the action
  const validAction = validateAction(processedEntry.type);
  if (validAction.error) {
    return validAction;
  }

  try {
    // Create the timesheet entry
    await prisma.timesheet.create({
      data: processedEntry,
    });

    // Calculate total time for the day
    const totalTime = await calculateTotalTime(employeeId, processedEntry);

    // Update or create the daily summary
    const logDate = new Date(processedEntry.time);
    logDate.setHours(0, 0, 0, 0);

    await prisma.dailySummary.upsert({
      where: { employeeId_date: { employeeId, date: logDate } },
      update: { totalTime },
      create: { employeeId, date: logDate, totalTime },
    });

    return { error: false };
  } catch (error) {
    console.error('Error processing entry:', error);
    return { error: true, message: 'Failed to process entry' };
  }
}

// Function to validate a single action
function validateAction(actionType) {
  const validActions = ['TIME_IN', 'BREAK', 'TIME_OUT'];
  if (!validActions.includes(actionType)) {
    return { error: true, message: `Invalid action type: ${actionType}` };
  }
  return { success: true };
}

// Function to calculate total time for the day based on single action
async function calculateTotalTime(employeeId, newEntry) {
  // Fetch today's entries from the database
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Fetch existing timesheet entries for today
  let timesheetEntries = await prisma.timesheet.findMany({
    where: {
      employeeID: employeeId,
      time: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    orderBy: { time: 'asc' },
  });

  // Append the new entry to today's entries for accurate calculation
  timesheetEntries.push(newEntry);

  // Calculate total active time based on the sequence of entries
  let totalTime = 0;
  let lastTimeIn = null;

  // Sort entries by time
  timesheetEntries.sort((a, b) => new Date(a.time) - new Date(b.time));

  timesheetEntries.forEach((entry) => {
    if (entry.type === 'TIME_IN') {
      lastTimeIn = new Date(entry.time);
    } else if (lastTimeIn && (entry.type === 'BREAK' || entry.type === 'TIME_OUT')) {
      const intervalTime = (new Date(entry.time) - lastTimeIn) / 1000; // Convert to seconds
      totalTime += intervalTime;
      lastTimeIn = null;
    }
  });

  // Ensure totalTime is an integer
  totalTime = Math.floor(totalTime);

  return totalTime;
}