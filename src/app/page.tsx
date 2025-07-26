"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from "@vis.gl/react-google-maps";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getTravelAdvice } from "./actions";
import type { TravelAdvice, Alert } from "@/types";
import { MapView } from "@/components/map-view";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import {
  Clock,
  CloudSun,
  Flag,
  LoaderCircle,
  MapIcon,
  MapPin,
  Route,
  Car,
  TrafficCone,
  TriangleAlert,
  Info,
  Lightbulb,
  CloudRain,
  ShieldAlert,
  CalendarClock
} from "lucide-react";

const formSchema = z.object({
  origin: z.string().min(3, { message: "Origin must be at least 3 characters." }),
  destination: z.string().min(3, { message: "Destination must be at least 3 characters." }),
});

const AnalysisResult = ({ analysis }: { analysis: TravelAdvice["routeAnalysis"] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Route className="text-primary" /> AI Route Analysis</CardTitle>
      <CardDescription>{analysis.prediction}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><TrafficCone size={18}/> Current Traffic</h3>
        <p className="pl-7">{analysis.trafficAnalysis}</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><CloudRain size={18}/> Weather Impact</h3>
        <p className="pl-7">{analysis.weatherImpact}</p>
      </div>
       <Separator/>
      <div className="space-y-3 p-4 bg-primary/10 rounded-lg">
        <h3 className="font-semibold flex items-center gap-2"><Lightbulb size={18} className="text-primary"/> AI Recommendation</h3>
        <ul className="space-y-2 pl-7 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-bold text-primary shrink-0">Primary:</span>
            <span>{analysis.aiRecommendation.primary}</span>
          </li>
           <li className="flex items-start gap-2">
            <span className="font-bold text-accent shrink-0">Alternative:</span>
             <span>{analysis.aiRecommendation.alternative}</span>
          </li>
           <li className="flex items-start gap-2">
            <span className="font-bold text-destructive shrink-0">Avoid:</span>
             <span>{analysis.aiRecommendation.avoid}</span>
          </li>
        </ul>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
        <CalendarClock size={16} />
        <span className="font-semibold">Best Departure:</span>
        <span>{analysis.bestDepartureTime}</span>
      </div>
    </CardContent>
  </Card>
);

const WeatherCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><CloudSun className="text-primary"/> Weather Conditions</CardTitle>
    </CardHeader>
    <CardContent className="flex items-center gap-4">
      <CloudSun size={48} className="text-yellow-500" />
      <div>
        <p className="text-2xl font-bold">28°C</p>
        <p className="text-muted-foreground">Partly Cloudy</p>
      </div>
    </CardContent>
  </Card>
);

const LiveReports = () => {
  const reports = [
    "Accident reported near Marathahalli bridge.",
    "Heavy congestion on Outer Ring Road towards Tin Factory.",
    "Procession on MG Road causing delays.",
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Car className="text-primary"/> Live Traffic Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {reports.map((report, index) => (
            <li key={index} className="flex items-start gap-3">
              <Info size={16} className="mt-1 text-muted-foreground shrink-0"/>
              <span>{report}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const getAlertIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'accident': return <TriangleAlert className="text-destructive" />;
    case 'road closure': return <TrafficCone className="text-orange-500" />;
    case 'congestion': return <Car className="text-yellow-500" />;
    default: return <ShieldAlert className="text-primary" />;
  }
};

const AlertsDisplay = ({ alerts }: { alerts: Alert[] }) => (
  <div className="h-full bg-card p-4 md:p-6 overflow-y-auto">
    <h2 className="text-xl font-bold mb-4">Predictive Alerts</h2>
    <div className="space-y-4">
      {alerts.sort((a,b) => b.relevance - a.relevance).map((alert, index) => (
        <Card key={index} className="bg-background">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="pt-1">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold capitalize">{alert.type}</h3>
                  <Badge variant={alert.relevance > 0.7 ? "destructive" : alert.relevance > 0.4 ? "secondary" : "default"} className="capitalize">{alert.relevance > 0.7 ? "High" : alert.relevance > 0.4 ? "Medium" : "Low"} Rel.</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.location}</p>
                <p className="text-sm mt-2">{alert.description}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                    <p><span className="font-semibold">Action:</span> {alert.recommendedAction}</p>
                </div>
                <div className="mt-3 space-y-1">
                   <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Confidence</span>
                    <span>{(alert.confidence * 100).toFixed(0)}%</span>
                   </div>
                   <Progress value={alert.confidence * 100} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const LoadingSkeletons = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
        </div>
         <div className="space-y-2 pt-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function Home() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [advice, setAdvice] = useState<TravelAdvice | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      setAdvice(null);
      try {
        const result = await getTravelAdvice(values);
        setAdvice(result);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      }
    });
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
        <aside className="w-full md:w-1/3 xl:w-1/4 h-full flex flex-col p-4 md:p-6 space-y-6 overflow-y-auto border-r">
          <header>
            <h1 className="text-2xl font-bold text-primary">Bengaluru Travel Advisory</h1>
            <p className="text-sm text-muted-foreground">Your AI guide to navigating the city.</p>
          </header>
          
          <Separator />
          
          <Card>
            <CardHeader>
              <CardTitle>Plan Your Route</CardTitle>
              <CardDescription>Enter your origin and destination to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><MapPin size={16}/> Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Koramangala" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Flag size={16}/> Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Indiranagar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? <LoaderCircle className="animate-spin" /> : "Get AI Route Advice"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {isPending && <LoadingSkeletons />}
          {advice?.routeAnalysis && <AnalysisResult analysis={advice.routeAnalysis} />}
          
          <WeatherCard />
          <LiveReports />

        </aside>
        
        <main className="w-full md:w-2/3 xl:w-3/4 flex flex-col h-full">
          <div className="flex-grow h-[60%] md:h-full relative">
            <MapView />
          </div>
          <div className="h-[40%] md:h-1/2 xl:h-1/3 border-t">
            {isPending && <div className="flex items-center justify-center h-full"><LoaderCircle className="animate-spin text-primary" size={32}/></div>}
            {advice?.predictiveAlerts ? <AlertsDisplay alerts={advice.predictiveAlerts.alerts} /> : 
             !isPending && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MapIcon size={48} className="text-muted-foreground mb-4"/>
                    <h3 className="text-lg font-semibold">Ready for Adventure?</h3>
                    <p className="text-muted-foreground">Enter your route to see live map data and AI-powered travel advice.</p>
                </div>
             )
            }
          </div>
        </main>
      </div>
    </APIProvider>
  );
}
