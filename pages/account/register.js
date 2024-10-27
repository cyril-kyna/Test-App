import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { registerFormSchema } from '../../lib/validation/validation-schema';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { buttonVariants } from "@/components/ui/button";

export default function Register() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter();

  return (
    <div>
      <h1 className="mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase">Registration</h1>
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          gender: '',
          username: '',
          password: ''
        }}
        validationSchema={registerFormSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const postData = {
              action: 'create',
              firstName: values.firstName,
              lastName: values.lastName,
              gender: values.gender,
              username: values.username,
              password: values.password,
            };

            const res = await fetch('/api/auth/authenticate-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            });

            if (res.ok) {
              const signInResponse = await signIn('credentials', {
                redirect: false,
                username: values.username,
                password: values.password,
              });

              if (signInResponse.ok) {
                router.push('/');
              } else {
                setFormStatus('Registered, but could not log in automatically.');
              }
              resetForm();
            } else {
              const errorData = await res.json();
              setFormStatus(errorData.message || 'Something went wrong. Please try again.');
            }
          } catch (error) {
            setFormStatus('An error occurred. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="bg-background min-w-[35rem] p-10 rounded-ss-xl rounded-xl border-[1px] border-zinc-700 space-y-4">
            <p className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/account/login" className={buttonVariants({ variant: "link" })}>
                Login
              </Link>
            </p>

            {/* First Name Input */}
            <div>
              <Field as={Input} id="firstName" name="firstName" type="text" placeholder="First Name" />
              <ErrorMessage name="firstName" component="p" className="text-red-500" />
            </div>

            {/* Last Name Input */}
            <div>
              <Field as={Input} id="lastName" name="lastName" type="text" placeholder="Last Name" />
              <ErrorMessage name="lastName" component="p" className="text-red-500" />
            </div>

            {/* Gender Select Input */}
            <div>
              <Select
                onValueChange={(value) => setFieldValue("gender", value)}
                value={values.gender}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage name="gender" component="p" className="text-red-500" />
            </div>

            {/* Username Input */}
            <div>
              <Field as={Input} id="username" name="username" type="text" placeholder="Username" />
              <ErrorMessage name="username" component="p" className="text-red-500" />
            </div>

            {/* Password Input */}
            <div>
              <Field as={Input} id="password" name="password" type="password" placeholder="Password" />
              <ErrorMessage name="password" component="p" className="text-red-500" />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
            {formStatus && <p className="text-center">{formStatus}</p>}
          </Form>
        )}
      </Formik>
    </div>
  );
}
