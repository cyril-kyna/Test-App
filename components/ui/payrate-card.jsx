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

export function PayrateCard({ className }) {
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
          effectiveDate: effectiveDate
            ? new Date(effectiveDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No effective date available.",
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
    <Card className={className}>
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
          </div>
        ) : (
          // Display actual pay rate details or fallback if data is unavailable
          <div className="space-y-2">
            <p>
              <strong>Your Payrate:</strong>{" "}
              {payRateInfo?.payRate !== undefined
                ? `$${payRateInfo.payRate.toFixed(2)} ${payRateInfo.payRateSchedule}`
                : "No payrate available."}
            </p>
            <p>
              <strong>Effective Date:</strong>{" "}
              {payRateInfo?.effectiveDate || "Not Set"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
