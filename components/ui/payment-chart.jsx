"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterIcon } from "@/public/images/filter-icon";
import { Skeleton } from "@/components/ui/skeleton";

export const description = "A bar chart";

// Chart configuration
const chartConfig = {
  desktop: {
    label: "Payment",
    color: "hsl(var(--chart-1))",
  },
};

export function PaymentChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("daily");

  useEffect(() => {
    // Fetch payment data based on selected filter
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/payrate/get-payments?filter=${filter}`);
        const data = await response.json();

        // Format the data for the chart
        const formattedData = data.groupedRecords
          .map((record) => ({
            date: record.date, // Use full date for each record
            desktop: record.payAmount,
          }))
          .reverse(); // Reverse to show oldest to newest

        console.log("Formatted Chart Data:", formattedData);
        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchData();
  }, [filter]);

  // Dynamic tickFormatter to handle different date formats for daily, weekly, and monthly filters
  const tickFormatter = (value) => {
    if (filter === "daily") {
      const date = new Date(value);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (filter === "weekly") {
      return value;
    } else if (filter === "monthly") {
      return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between items-start">
          <div className="flex flex-col">
            <CardTitle>Your Payments</CardTitle>
            <CardDescription>{`${filter.charAt(0).toUpperCase() + filter.slice(1)} Payments`}</CardDescription>
          </div>
          <div className="flex justify-between items-center mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button>
                  <p>Filter by:</p>
                  <FilterIcon color="black" width={20} height={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-2">
                <Button onClick={() => setFilter("daily")}>Daily</Button>
                <Button onClick={() => setFilter("weekly")}>Weekly</Button>
                <Button onClick={() => setFilter("monthly")}>Monthly</Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          // Skeleton loader while data is loading
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          // Render the chart once data is loaded
          <ChartContainer config={chartConfig}>
            <BarChart width={800} data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={0}
                tickFormatter={tickFormatter}
              />
              <YAxis />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total payments for each {filter}.
        </div>
      </CardFooter>
    </Card>
  );
}
