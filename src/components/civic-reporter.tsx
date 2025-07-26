"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ReportView } from "./report-view";

export function CivicReporter() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Civic Reporter</CardTitle>
        <CardDescription>
          Report civic issues you observe in the city.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReportView />
      </CardContent>
    </Card>
  );
}
