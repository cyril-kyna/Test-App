import { Playfair } from "next/font/google";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Formik, Form, ErrorMessage } from 'formik';
import { useState } from 'react';  // Import useState to manage button state
import { employeePayrateFormSchema } from '../../lib/validation/validation-schema';

const playfair = Playfair({ subsets: ["latin"] });

export default function Employee() {
  // State to handle the form submission and button disable logic
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div>
      <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>
        Employee
      </h1>
      <Formik
        initialValues={{
          payPeriod: '',
          payRate: '',
          payRateSchedule: '',
          effectiveDate: '',
        }}
        validationSchema={employeePayrateFormSchema}
        onSubmit={(values, { setSubmitting }) => {
          setIsSubmitting(true);  // Disable the button
          console.log(values);
          
          // Simulate form submission
          setTimeout(() => {
            // After submission, reset the state and allow re-submission if necessary
            setIsSubmitting(false);
            setSubmitting(false); // Let Formik know that submission is done
          }, 2000);  // Simulating a 2 second server response time
        }}
      >
        {({ handleSubmit, setFieldValue, values }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-7 bg-[var(--dark)] min-w-[35rem] max-w-[35rem] p-10 rounded-ss-xl rounded-ee-xl border-[1px] border-[var(--ten-opacity-white)] space-y-4">
            <div className="flex flex-col gap-5">
              {/* Pay Period */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-2">
                  <p>Pay Period</p>
                  <ErrorMessage name="payPeriod" component="div" className="text-red-500 text-sm" />
                </div>
                <Select
                  value={values.payPeriod}
                  onValueChange={(value) => setFieldValue('payPeriod', value)}
                >
                  <SelectTrigger className="rounded">
                    <SelectValue placeholder="Select Pay Period" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--dark)] rounded">
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Pay Rate */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-2">
                  <p>Pay Rate</p>
                  <ErrorMessage name="payRate" component="div" className="text-red-500 text-sm" />
                </div>
                <Input
                  id="payRate"
                  name="payRate"
                  type="number"
                  placeholder="Enter a Pay Rate"
                  className="rounded border-zinc-400 focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
                  value={values.payRate}
                  onChange={(e) => setFieldValue('payRate', e.target.value)}
                />
              </div>
              {/* Pay Rate Schedule */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-2">
                  <p>Pay Rate Schedule</p>
                  <ErrorMessage name="payRateSchedule" component="div" className="text-red-500 text-sm" />
                </div>
                <Select
                  value={values.payRateSchedule}
                  onValueChange={(value) => setFieldValue('payRateSchedule', value)}
                >
                  <SelectTrigger className="rounded">
                    <SelectValue placeholder="Select Rate Schedule" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--dark)] rounded">
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Effective Date */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-2">
                  <p>Effective Date</p>
                  <ErrorMessage name="effectiveDate" component="div" className="text-red-500 text-sm" />
                </div>
                <DatePicker
                  selected={values.effectiveDate}
                  onChange={(date) => setFieldValue('effectiveDate', date)}
                />
              </div>
            </div>
            {/* Submit Button */}
            <Button 
              className="w-full bg-[var(--dark-grey)] hover:bg-[--light-dark-grey] rounded" 
              type="submit" 
              disabled={isSubmitting}  // Disable button when submitting
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}  {/* Change button text when submitting */}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
