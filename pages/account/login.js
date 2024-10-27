import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { loginFormSchema } from '../../lib/validation/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { buttonVariants } from "@/components/ui/button";

export default function Login() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter();

  return (
    <div>
      <h1 className="mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase">Login</h1>
      <Formik
        initialValues={{
          username: '',
          password: ''
        }}
        validationSchema={loginFormSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const res = await fetch('/api/auth/authenticate-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'read',
                username: values.username,
                password: values.password
              }),
            });

            const data = await res.json();

            if (res.ok) {
              const signInResponse = await signIn('credentials', {
                redirect: false,
                username: values.username,
                password: values.password,
              });

              if (signInResponse.ok) {
                router.push('/');
              } else {
                setFormStatus('Login failed. Please try again.');
              }
            } else {
              setFormStatus(data.message || 'Login failed. Please try again.');
            }
          } catch (error) {
            setFormStatus('An error occurred. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="min-w-[35rem] p-10 rounded-ss-xl rounded-xl border-[1px] border-zinc-700 space-y-4">
            <p className="text-center text-sm">
              Don&#39;t have an account?{' '}
              <Link href="/account/register" className={buttonVariants({ variant: "link" })}>
                Register
              </Link>
            </p>

            {/* Username Input */}
            <div>
              <Field
                as={Input}
                id="username"
                name="username"
                type="text"
                placeholder="Username"
              />
              <ErrorMessage name="username" component="p" className="text-red-500" />
            </div>

            {/* Password Input */}
            <div>
              <Field
                as={Input}
                id="password"
                name="password"
                type="password"
                placeholder="Password"
              />
              <ErrorMessage name="password" component="p" className="text-red-500" />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
            {formStatus && <p className="text-center">{formStatus}</p>}
          </Form>
        )}
      </Formik>
    </div>
  );
}
