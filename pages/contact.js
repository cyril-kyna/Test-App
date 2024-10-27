import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { contactFormSchema } from '../lib/validation/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
  const [formStatus, setFormStatus] = useState(null);

  return (
    <div className='mb-40'>
      <h1 className="mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase">Contact</h1>
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          contactNo: '',
          emailAddress: '',
          subject: '',
          message: ''
        }}
        validationSchema={contactFormSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            // Add the action field for creation
            const postData = { ...values, action: 'create' };

            const res = await fetch('/api/inquiries/manage-inquiry', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            });

            if (res.ok) {
              setFormStatus('Success! Your inquiry was submitted.');
              resetForm();
            } else {
              setFormStatus('Something went wrong. Please try again.');
            }
          } catch (error) {
            setFormStatus('An error occurred. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="bg-background min-w-[35rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
            <p className="text-center">Leave us a message, If you have any inquiry.</p>

            {/* Form Inputs */}
            <div>
              <Field as={Input} id="firstName" name="firstName" type="text" placeholder="First Name" />
              <ErrorMessage name="firstName" component="p" className="text-red-500" />
            </div>

            <div>
              <Field as={Input} id="lastName" name="lastName" type="text" placeholder="Last Name" />
              <ErrorMessage name="lastName" component="p" className="text-red-500" />
            </div>

            <div>
              <Field as={Input} id="contactNo" name="contactNo" type="text" placeholder="Contact Number" />
              <ErrorMessage name="contactNo" component="p" className="text-red-500" />
            </div>

            <div>
              <Field as={Input} id="emailAddress" name="emailAddress" type="email" placeholder="Email Address" />
              <ErrorMessage name="emailAddress" component="p" className="text-red-500" />
            </div>

            <div>
              <Field as={Input} id="subject" name="subject" type="text" placeholder="Subject" />
              <ErrorMessage name="subject" component="p" className="text-red-500" />
            </div>

            <div>
              <Field as={Textarea} id="message" name="message" placeholder="Your message" />
              <ErrorMessage name="message" component="p" className="text-red-500" />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
            {formStatus && <p className='text-center'>{formStatus}</p>}
          </Form>
        )}
      </Formik>
    </div>
  );
}
