"use client";

import React, { useState } from "react";
import { User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewReportForm } from "./new-report-form";
import { ReportHistory } from "./report-history";

interface ReportViewProps {
  user: User;
}

export function ReportView({ user }: ReportViewProps) {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Success", description: "Logged out successfully." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Logged in as {user.email}
        </p>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <Tabs defaultValue="new-report" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-report">New Report</TabsTrigger>
          <TabsTrigger value="history">My Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="new-report">
          <NewReportForm user={user} />
        </TabsContent>
        <TabsContent value="history">
          <ReportHistory userId={user.uid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
