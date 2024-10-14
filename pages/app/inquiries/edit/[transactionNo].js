import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useFormik } from "formik";
import { contactFormSchema } from "@/lib/validation/validation-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select component exists
import { Playfair } from "next/font/google";
import routes from '@/routes';

const playfair = Playfair({ subsets: ["latin"] });

export default function EditInquiry() {
  const router = useRouter();
  const { transactionNo } = router.query;

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formStatus, setFormStatus] = useState(null);

  // Fetch inquiry details by transactionNo
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

  const handleGoBack = () => {
    router.push(routes.inquries);
  };

  // Handle form submission
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: inquiry?.firstName || "",
      lastName: inquiry?.lastName || "",
      contactNo: inquiry?.contactNo || "",
      emailAddress: inquiry?.emailAddress || "",
      subject: inquiry?.subject || "",
      message: inquiry?.message || "",
      status: inquiry?.status || "pending",
    },
    validationSchema: contactFormSchema,
    onSubmit: async (values) => {
      try {
        // Add the action field for update
        const postData = { ...values, action: 'update', transactionNo };

        const res = await fetch(`/api/inquiries/manage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          setFormStatus('Inquiry updated successfully.');
        } else {
          setFormStatus('Failed to update inquiry.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  if (loading) {
    return <div className="text-center text-[1.25rem] font-black mt-96">Loading inquiry details...</div>;
  }

  if (error) {
    return <div className="text-center text-[1.25rem] font-black mt-96">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>Edit Inquiry</h1>
      <div className="mt-5 flex flex-col items-end gap-3">
        <Button className="bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded" onClick={handleGoBack}>← Back to Inquiries</Button>
        <form onSubmit={formik.handleSubmit} className="bg-[var(--dark)] min-w-[35rem] max-w-[35rem] p-10 rounded-ss-xl rounded-ee-xl border-[1px] border-[var(--ten-opacity-white)] space-y-4">
          {/* Form Inputs */}
          <div>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.firstName}
              placeholder="First Name"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <p className="text-red-500">{formik.errors.firstName}</p>
            )}
          </div>
          <div>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.lastName}
              placeholder="Last Name"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <p className="text-red-500">{formik.errors.lastName}</p>
            )}
          </div>
          {/* Remaining Form Inputs */}
          <div>
            <Input
              id="contactNo"
              name="contactNo"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.contactNo}
              placeholder="Contact Number"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.contactNo && formik.errors.contactNo && (
              <p className="text-red-500">{formik.errors.contactNo}</p>
            )}
          </div>
          <div>
            <Input
              id="emailAddress"
              name="emailAddress"
              type="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.emailAddress}
              placeholder="Email Address"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.emailAddress && formik.errors.emailAddress && (
              <p className="text-red-500">{formik.errors.emailAddress}</p>
            )}
          </div>
          <div>
            <Input
              id="subject"
              name="subject"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.subject}
              placeholder="Subject"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.subject && formik.errors.subject && (
              <p className="text-red-500">{formik.errors.subject}</p>
            )}
          </div>
          <div>
            <Textarea
              id="message"
              name="message"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.message}
              placeholder="Your message"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.message && formik.errors.message && (
              <p className="text-red-500">{formik.errors.message}</p>
            )}
          </div>
          <div>
            <Select onValueChange={(value) => formik.setFieldValue("status", value)} value={formik.values.status}>
              <SelectTrigger className="rounded">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--dark)] rounded">
                <SelectItem className="hover:bg-[var(--dark-grey)]" value="Pending">Pending</SelectItem>
                <SelectItem value="Read">Read</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.status && formik.errors.status && (
              <p className="text-red-500">{formik.errors.status}</p>
            )}
          </div>
          <Button className="w-full bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded" type="submit" disabled={formik.isSubmitting}>Update Inquiry</Button>
          {formStatus && <p className="text-center">{formStatus}</p>}
        </form>
      </div>
    </div>
  );
}
