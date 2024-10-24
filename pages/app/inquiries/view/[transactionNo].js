import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Playfair } from "next/font/google";
import routes from '@/routes';

const playfair = Playfair({ subsets: ["latin"] });

export default function InquiryDetails() {
  const router = useRouter();
  const { transactionNo } = router.query;  // Extract the transactionNo from the URL

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch inquiry details using the transactionNo
  const fetchInquiryDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inquiries/view/${transactionNo}`);
      if (!response.ok) {
        throw new Error(`Error fetching inquiry details: ${response.status}`);
      }
      const data = await response.json();
      setInquiry(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transactionNo]);

  useEffect(() => {
    if (transactionNo) {
      fetchInquiryDetails();
    }
  }, [transactionNo, fetchInquiryDetails]);

  // Navigate back to the inquiries list
  const handleGoBack = () => {
    router.push(routes.inquries);  // Redirect to the inquiries list page
  };

  // Render loading message
  if (loading) {
    return <div className="text-center text-[1.25rem] font-black mt-96">Loading inquiry details...</div>;
  }

  // Render error message
  if (error) {
    return <div className="text-center text-[1.25rem] font-black mt-96 text-red-500">Error: {error}</div>;
  }

  // Render inquiry details when data is available
  return (
    <div>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>
        Inquiry Details
      </h1>
      <div className="mt-5 flex flex-col items-end gap-3">
        <Button onClick={handleGoBack}>← Back to Inquiries</Button>
        {inquiry && (
          <div className="flex flex-col min-w-[50rem] gap-3 bg-background p-10 rounded-xl border-[1px] border-zinc-700">
            <h1><strong>Transaction No:</strong> {inquiry.transactionNo}</h1>
            <p><strong>First Name:</strong> {inquiry.firstName}</p>
            <p><strong>Last Name:</strong> {inquiry.lastName}</p>
            <p><strong>Contact No:</strong> {inquiry.contactNo}</p>
            <p><strong>Email Address:</strong> {inquiry.emailAddress}</p>
            <p><strong>Subject:</strong> {inquiry.subject}</p>
            <p><strong>Message:</strong> {inquiry.message}</p>
            <p><strong>Status:</strong> {inquiry.status}</p>
            <p><strong>Created:</strong> {new Date(inquiry.created).toLocaleString()}</p>
            <p><strong>Modified:</strong> {new Date(inquiry.modified).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}