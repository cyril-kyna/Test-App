import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { contactFormSchema } from "@/lib/validation/validation-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select component exists
import routes from '@/routes';

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
    router.push(routes.inquiries);
  };

  if (loading) {
    return <div className="text-center text-[1.25rem] font-black mt-96">Loading inquiry details...</div>;
  }

  if (error) {
    return <div className="text-center text-[1.25rem] font-black mt-96">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase">Edit Inquiry</h1>
      <div className="mt-5 flex flex-col items-end gap-3">
        <Button onClick={handleGoBack}>← Back to Inquiries</Button>

        <Formik
          initialValues={{
            firstName: inquiry?.firstName || "",
            lastName: inquiry?.lastName || "",
            contactNo: inquiry?.contactNo || "",
            emailAddress: inquiry?.emailAddress || "",
            subject: inquiry?.subject || "",
            message: inquiry?.message || "",
            status: inquiry?.status || "pending",
          }}
          validationSchema={contactFormSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const postData = { ...values, action: 'update', transactionNo };

              const res = await fetch(`/api/inquiries/manage-inquiry`, {
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
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="flex flex-col min-w-[50rem] gap-3 bg-background p-10 rounded-xl border-[1px] border-zinc-700">
              {/* Form Inputs */}
              <div>
                <Field
                  as={Input}
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                />
                <ErrorMessage name="firstName" component="p" className="text-red-500" />
              </div>

              <div>
                <Field
                  as={Input}
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                />
                <ErrorMessage name="lastName" component="p" className="text-red-500" />
              </div>

              <div>
                <Field
                  as={Input}
                  id="contactNo"
                  name="contactNo"
                  type="text"
                  placeholder="Contact Number"
                />
                <ErrorMessage name="contactNo" component="p" className="text-red-500" />
              </div>

              <div>
                <Field
                  as={Input}
                  id="emailAddress"
                  name="emailAddress"
                  type="email"
                  placeholder="Email Address"
                />
                <ErrorMessage name="emailAddress" component="p" className="text-red-500" />
              </div>

              <div>
                <Field
                  as={Input}
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Subject"
                />
                <ErrorMessage name="subject" component="p" className="text-red-500" />
              </div>

              <div>
                <Field
                  as={Textarea}
                  id="message"
                  name="message"
                  placeholder="Your message"
                />
                <ErrorMessage name="message" component="p" className="text-red-500" />
              </div>

              <div>
                <Select
                  onValueChange={(value) => setFieldValue("status", value)}
                  value={values.status}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Read">Read</SelectItem>
                  </SelectContent>
                </Select>
                <ErrorMessage name="status" component="p" className="text-red-500" />
              </div>

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Inquiry'}
              </Button>
              {formStatus && <p className="text-center">{formStatus}</p>}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
