import { Playfair } from "next/font/google";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Formik, Form, ErrorMessage } from 'formik';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeePayrateFormSchema } from '../../lib/validation/validation-schema';
import { useSession } from "next-auth/react";
import { FilterIcon } from '@/public/images/filter-icon';

const playfair = Playfair({ subsets: ["latin"] });

export default function Employee() {
  // State to handle form submission and button disable logic
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const { data: session } = useSession();
  // State to manage the filter type
  const [filter, setFilter] = useState('daily');
  // Function to handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmitting(true);
    try {
      // Log the exact JSON being sent
      console.log("Request JSON: ", JSON.stringify(values, null, 2));

      const response = await fetch('/api/payrate/calculate-payrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),  // Send the values as JSON
      });

      if (response.ok) {
        console.log('Payrate calculation successful');
        // Fetch updated payment records after submission
        fetchPaymentRecords();
      } else {
        console.error('Error calculating payrate');
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
    }
    setIsSubmitting(false);
    setSubmitting(false);
  };

  // Function to fetch payment records from the API
  const fetchPaymentRecords = async () => {
    try {
      const response = await fetch(`/api/payrate/get-payments?filter=${filter}`);
      const data = await response.json();
      if (response.ok) {
        setPaymentRecords(data);
      } else {
        console.error('Error fetching payment records:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
    }
  };

  // Fetch payment records on component mount and when session or filter changes
  useEffect(() => {
    if (session) {
      fetchPaymentRecords();
    }
  }, [session, filter]);
  
  return (
    <div className="flex flex-col gap-10 mt-28">
      <div className="flex flex-col items-start">
        <h1 className={`${playfair.className} text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>
          Employee
        </h1>
        <p className={`${playfair.className} text-[var(--grey-white)] text-center text-[1.5rem] font-[900] uppercase`}>
          Employee Name: <u> {session ? `${session.user.firstName} ${session.user.lastName}` : "Guest"} </u>
        </p>
      </div>
      <div className="flex flex-row items-start gap-20">
        <div className="flex flex-col gap-2">
          <h1 className={`${playfair.className} text-[var(--grey-white)] text-left text-[1.5rem] font-[700] text-balance uppercase`}>
            Set Pay Rate
          </h1>
          <Formik
            initialValues={{
              payRate: '',
              payRateSchedule: '',
              effectiveDate: '',
            }}
            validationSchema={employeePayrateFormSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, setFieldValue, values }) => (
              <Form onSubmit={handleSubmit} className="flex flex-col gap-7 bg-background min-w-[35rem] max-w-[35rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
                <div className="flex flex-col gap-5">
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
                      value={values.payRate}
                      onChange={(e) => setFieldValue('payRate', Number(e.target.value))} // Ensure numeric value
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select Rate Schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Effective Date */}
                  <div className="flex flex-col gap-1">
                    <p>Effective Date</p>
                    <DatePicker
                      date={values.effectiveDate}
                      onChange={(date) => {
                        setFieldValue('effectiveDate', date);  // Set the raw date without formatting
                      }}
                    />
                    <ErrorMessage name="effectiveDate" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>
                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}  {/* Change button text when submitting */}
                </Button>
              </Form>
            )}
          </Formik>
        </div>
        <div className="flex flex-col min-w-96 gap-2">
          <div className="flex flex-row justify-between items-center">
            <h1 className={`${playfair.className} text-[var(--grey-white)] text-left text-[1.5rem] font-[700] text-balance uppercase`}>Payment Records</h1>
            <Popover>
            <PopoverTrigger asChild>
              <Button>
                <p>Filter by:</p>
                <FilterIcon color="black" width={20} height={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2">
              <Button
              
                onClick={() => {
                  setFilter('daily');
                }}
              >
                Daily
              </Button>
              <Button
              
                onClick={() => {
                  setFilter('weekly');
                }}
              >
                Weekly
              </Button>
              <Button
              
                onClick={() => {
                  setFilter('monthly');
                }}
              >
                Monthly
              </Button>
            </PopoverContent>
          </Popover>
          </div>
          <div className="flex flex-col gap-7 bg-background min-w-[35rem] max-w-[35rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-36">Date</TableHead>
                <TableHead className="min-w-36">Payroll Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRecords.length > 0 ? (
                paymentRecords.map((record) => (
                  <TableRow key={record.date}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>${record.payAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="2">No payment records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>
    </div>
  );
}