// /api/payout/mark-paid.js

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

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

    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No records provided' });
    }

    // Update the provided payment records to set them as "Paid"
    await prisma.paymentRecord.updateMany({
      where: { id: { in: records } },
      data: { status: 'Paid' },
    });

    return res.status(200).json({ message: 'Records marked as paid' });
  } catch (error) {
    console.error('Error marking records as paid:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
