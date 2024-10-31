// utils/getEmployeeId.js
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// Initialize Prisma client
const prisma = new PrismaClient();

/** 
 * 
 * Global helper functions
 * 
*/

// Helper function to get the employee ID from the session
export async function getEmployeeId(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  const employeeNo = session?.user?.employeeID;
  if (!employeeNo) {
    res.status(401).json({ message: "Unauthorized: No employee number found" });
    return null;
  }

  const employee = await prisma.employee.findUnique({ where: { employeeNo } });
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return null;
  }

  return employee.id;
}

export function formatDateToAmPm(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateToDateWithWeekday(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatSecondsIntoHoursMinutesSeconds(givenSeconds) {
  const hours = Math.floor(givenSeconds / 3600);
  const minutes = Math.floor((givenSeconds % 3600) / 60);
  const seconds = givenSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}