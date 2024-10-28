"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PayrateCard() {
  const [payRateInfo, setPayRateInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch pay rate information
    const fetchPayRateInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/payrate/get-payments?filter=daily");
        const data = await response.json();

        // Destructure the necessary pay rate details from the response
        const { payRate, payRateSchedule, effectiveDate } = data;
        setPayRateInfo({
          payRate,
          payRateSchedule,
          effectiveDate: new Date(effectiveDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        });
      } catch (error) {
        console.error("Error fetching pay rate information:", error);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchPayRateInfo();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Payrate</CardTitle>
        <CardDescription>Current pay rate information</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Display skeleton loaders while fetching data
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" /> {/* Pay Rate */}
            <Skeleton className="h-6 w-1/2" /> {/* Pay Rate Schedule */}
            <Skeleton className="h-6 w-1/2" /> {/* Effective Date */}
          </div>
        ) : (
          // Display actual pay rate details once data is loaded
          <div className="space-y-2">
            <p>
              <strong>Your Payrate:</strong> ${payRateInfo?.payRate?.toFixed(2)} {payRateInfo?.payRateSchedule}
            </p>
            <p>
              <strong>Effective Date:</strong> {payRateInfo?.effectiveDate}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
