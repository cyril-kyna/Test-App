import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Formik, Form, ErrorMessage } from 'formik';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeePayrateFormSchema } from '../../../lib/validation/validation-schema';
import { useSession } from "next-auth/react";
import { FilterIcon } from '@/public/images/filter-icon';
import { EmployeeNavbar } from '../employee/components/employee-nav-bar' 

export default function Employee() {
  // State to handle form submission and button disable logic
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const { data: session } = useSession();
  const [filter, setFilter] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [initialPayRate, setInitialPayRate] = useState({
    payRate: '',
    payRateSchedule: '',
    effectiveDate: '',
  });
  return (
    <div className="flex flex-col gap-10 mt-28">
      <div className="flex flex-col items-start">
        <h1 className="text-[var(--white)] text-center text-[5rem] font-[900] uppercase">
          Employee
        </h1>
        <p className="text-[var(--grey-white)] text-center text-[1.5rem] font-[900] uppercase">
          Employee Name: <u> {session ? `${session.user.firstName} ${session.user.lastName}` : "Guest"} </u>
        </p>
      </div>
      <div className="flex flex-col gap-5 bg-background min-w-[60rem] min-h-[30rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
        <EmployeeNavbar/>
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-7">
            <h1 className="text-[var(--grey-white)] text-left text-xl font-semibold text-balance">
              Set payout schedule.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
