import React, { useState } from 'react';
import { useFormik } from 'formik';
import { registerFormSchema } from '../../lib/validation/validation-schema'; // Updated import
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Playfair } from 'next/font/google';
import { signIn } from 'next-auth/react'; // Import signIn for client-side
import { useRouter } from 'next/router'; // Import router for redirection
import Link from 'next/link';
import { buttonVariants } from "@/components/ui/button"

const playfair = Playfair({
  subsets: ['latin']
});

export default function Register() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter(); // Initialize Next.js router for redirection

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      username: '',
      password: ''
    },
    validationSchema: registerFormSchema, // Use registerFormSchema for validation
    onSubmit: async (values) => {
      try {
        // Add action: 'create' field (status is removed)
        const postData = {
          action: 'create',  // Specify this is a create action
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender,
          username: values.username,
          password: values.password,
        };

        // Call registration API
        const res = await fetch('/api/auth/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          // Auto-login the user after registration
          const signInResponse = await signIn('credentials', {
            redirect: false, // Do not redirect automatically
            username: values.username,
            password: values.password,
          });

          if (signInResponse.ok) {
            // Redirect to home page after successful login
            router.push('/');
          } else {
            setFormStatus('Registered, but could not log in automatically.');
          }
        } else {
          const errorData = await res.json();
          setFormStatus(errorData.message || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>Registration</h1>
      <form onSubmit={formik.handleSubmit} className="bg-background min-w-[35rem] p-10 rounded-ss-xl rounded-xl border-[1px] border-zinc-700 space-y-4">
        <p className="text-center text-sm">Already have an account? <Link href="/account/login" className={buttonVariants({ variant: "link" })}>Login</Link></p>

        {/* First Name Input */}
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

        {/* Last Name Input */}
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

        {/* Gender Select Input */}
        <div>
          <Select onValueChange={(value) => formik.setFieldValue("gender", value)} value={formik.values.gender}>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
          {formik.touched.gender && formik.errors.gender && (
            <p className="text-red-500">{formik.errors.gender}</p>
          )}
        </div>

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
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500">{formik.errors.password}</p>
          )}
        </div>

        <Button className="w-full" type="submit" disabled={formik.isSubmitting}>Register</Button>

        {formStatus && <p className='text-center'>{formStatus}</p>}
      </form>
    </div>
  );
}
