import { useFormik } from 'formik';
import { contactFormSchema } from '../lib/validation/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Playfair } from "next/font/google";

const playfair = Playfair({
  subsets: ['latin']
});

export default function Contact() {
  const [formStatus, setFormStatus] = useState(null);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      contactNo: '',
      emailAddress: '',
      subject: '',
      message: ''
    },
    validationSchema: contactFormSchema,
    onSubmit: async (values) => {
      try {
        // Add the action field for creation
        const postData = { ...values, action: 'create' };

        const res = await fetch('/api/inquiries/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          setFormStatus('Success! Your inquiry was submitted.');
        } else {
          setFormStatus('Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div className='mb-40'>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>Contact</h1>
      <form onSubmit={formik.handleSubmit} className="bg-background min-w-[35rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
        <p className="text-center">Leave us a message, If you have any inquiry.</p>
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
          />
          {formik.touched.message && formik.errors.message && (
            <p className="text-red-500">{formik.errors.message}</p>
          )}
        </div>
        <Button className="w-full" type="submit" disabled={formik.isSubmitting}>Submit</Button>
        {formStatus && <p className='text-center'>{formStatus}</p>}
      </form>
    </div>
  );
}
