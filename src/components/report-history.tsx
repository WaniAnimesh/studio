"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface ReportHistoryProps {
  userId: string;
}

interface Report {
  id: string;
  description: string;
  department: string;
  imageUrl: string;
  status: string;
  createdAt: {
    toDate: () => Date;
  };
}

export function ReportHistory({ userId }: ReportHistoryProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'reports'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData: Report[] = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() } as Report);
      });
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <p>Loading report history...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Submitted Reports</CardTitle>
        <CardDescription>Here is a list of all the issues you have reported.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length === 0 ? (
          <p>You haven&apos;t submitted any reports yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="p-0">
                   <Image
                      src={report.imageUrl}
                      alt={`Report about ${report.department}`}
                      width={400}
                      height={250}
                      className="object-cover w-full h-48"
                      data-ai-hint="civic issue"
                    />
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm">{report.description}</p>
                   <p className="text-xs text-muted-foreground">
                    Submitted: {report.createdAt.toDate().toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center p-4 bg-muted/50">
                    <Badge variant="secondary">{report.department}</Badge>
                    <Badge>{report.status}</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
