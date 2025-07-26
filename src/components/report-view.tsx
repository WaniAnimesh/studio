"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewReportForm } from "./new-report-form";

export function ReportView() {
  return (
    <div className="w-full">
      <Tabs defaultValue="new-report" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="new-report">New Report</TabsTrigger>
        </TabsList>
        <TabsContent value="new-report">
          <NewReportForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
