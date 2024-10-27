import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import routes from '@/routes';


export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch inquiries from the API
  const fetchInquiries = async () => {
    try {
      setLoading(true);  // Set loading state
      const response = await fetch("/api/inquiries");

      if (!response.ok) {
        throw new Error(`Error fetching inquiries: ${response.status}`);
      }

      const data = await response.json();
      setInquiries(data);  // Set the fetched data
    } 
    catch (err) {
      setError(err.message);  // Set error state
    } 
    finally {
      setLoading(false);  // Always set loading to false after the request completes
    }
  };
  // Call the fetch function on component mount
  useEffect(() => {
    fetchInquiries();
  }, []);

  // Navigate to the inquiry details page
  const handleViewDetails = (transactionNo) => {
    router.push(routes.viewInquries.replace("[transactionNo]", transactionNo));
  };
  // Navigate to the inquiry edit page
  const handleEditInquiry = (transactionNo) => {
    router.push(routes.editInquries.replace("[transactionNo]", transactionNo));
  };

  // Render loading message
  if (loading) {
    return <div className="text-center text-[1.25rem] font-black mt-96">Loading Inquiries...</div>;
  }
  // Render error message
  if (error) {
    return <div className="text-center text-[1.25rem] font-black mt-96 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="mt-40 text-center text-[5rem] font-[900] uppercase">
        Inquiries
      </h1>
      <div className="container my-10 bg-background p-5 border-zinc-700 rounded-xl border-[1px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className="w-32">First Name</TableHead>
              <TableHead className="w-24">Last Name</TableHead>
              <TableHead>Contact No</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction No</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-10">
                  No Inquiries found
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry) => (
                <TableRow key={inquiry.transactionNo}>
                  <TableCell>{inquiry.id}</TableCell>
                  <TableCell>{inquiry.firstName}</TableCell>
                  <TableCell>{inquiry.lastName}</TableCell>
                  <TableCell>{inquiry.contactNo}</TableCell>
                  <TableCell>{inquiry.emailAddress}</TableCell>
                  <TableCell>{inquiry.subject}</TableCell>
                  <TableCell>
                    {inquiry.message.length > 100
                      ? inquiry.message.substr(0, 100) + '...'
                      : inquiry.message}
                  </TableCell>
                  <TableCell>{inquiry.status}</TableCell>
                  <TableCell>{inquiry.transactionNo}</TableCell>
                  <TableCell>{new Date(inquiry.created).toLocaleString()}</TableCell>
                  <TableCell>{new Date(inquiry.modified).toLocaleString()}</TableCell>
                  <TableCell className="flex flex-col gap-2">
                    <Button onClick={() => handleViewDetails(inquiry.transactionNo)}>
                      View Details
                    </Button>
                    <Button onClick={() => handleEditInquiry(inquiry.transactionNo)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}