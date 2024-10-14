import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function fetchAllInquiries(req, res) {
  // Check for method type: Only GET allowed
  if (req.method === 'GET') {
    try {
      // Retrieve all inquiries from the database
      const allContactInquiries = await prisma.inquiries.findMany({
        orderBy: { id: 'asc' },
      });
      // Return inquiries
      return res.status(200).json(allContactInquiries);
    } catch (error) {
      // Return a 500 error if something goes wrong
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  return res.status(405).json({ message: 'Method Not Allowed' });
}
