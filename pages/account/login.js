import React, { useState } from 'react';
import { useFormik } from 'formik';
import { loginFormSchema } from '../../lib/validation/validation-schema'; // Updated import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Playfair } from 'next/font/google';
import { useRouter } from 'next/router'; // Import router for redirection
import { signIn } from 'next-auth/react'; // Import signIn for next-auth

const playfair = Playfair({
  subsets: ['latin']
});

export default function Login() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter(); // Initialize router for redirection

  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema: loginFormSchema, // Use loginFormSchema for validation
    onSubmit: async (values) => {
      try {
        // Call the manage API with the read action for login
        const res = await fetch('/api/auth/manage', {
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
          // Sign the user in using NextAuth if login was successful
          const signInResponse = await signIn('credentials', {
            redirect: false, // No auto-redirect
            username: values.username,
            password: values.password,
          });

          if (signInResponse.ok) {
            // Redirect the user to the homepage
            router.push('/');
          } else {
            setFormStatus('Login failed. Please try again.');
          }
        } else {
          setFormStatus(data.message || 'Login failed. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>Login</h1>
      <form onSubmit={formik.handleSubmit} className="bg-[var(--dark)] min-w-[35rem] max-w-[35rem] p-10 rounded-ss-xl rounded-ee-xl border-[1px] border-[var(--ten-opacity-white)] space-y-4">
        <p className="text-center">Don't have an account? <a href="/account/register" className="text-[var(--starred)] hover:underline">Register</a></p>
        {/* Username Input */}
        <div>
          <Input
            id="username"
            name="username"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.username}
            placeholder="Username"
            className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
          />
          {formik.touched.username && formik.errors.username && (
            <p className="text-red-500">{formik.errors.username}</p>
          )}
        </div>
        {/* Password Input */}
        <div>
          <Input
            id="password"
            name="password"
            type="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            placeholder="Password"
            className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500">{formik.errors.password}</p>
          )}
        </div>
        <Button className="w-full bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded" type="submit" disabled={formik.isSubmitting}>Login</Button>
        {formStatus && <p className='text-center'>{formStatus}</p>}
      </form>
    </div>
  );
}
