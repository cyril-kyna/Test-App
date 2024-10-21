import React from 'react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormik } from 'formik';
import { Playfair } from "next/font/google";

const playfair = Playfair({
  subsets: ['latin']
});

export default function Employee() {
  return (
    <div>
       <h1 className={`${playfair.className} mt-40 text-[var(--white)] text-center text-[5rem] font-[900] uppercase`}>Employee</h1>
       <div>
        <Select>
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
        <Input
          id="payRate"
          name="payRate"
          type="number"
          placeholder="Enter a Pay Rate"
          className="rounded border-zinc-400 focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
        />
        <Select>
          <SelectTrigger className="rounded">
            <SelectValue placeholder="Select Rate Schedule" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--dark)] rounded">
            <SelectItem value="Hourly">Hourly</SelectItem>
            <SelectItem value="Daily">Daily</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker />
       </div>
    </div>
  )
}
