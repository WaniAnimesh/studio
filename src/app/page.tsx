"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from "@vis.gl/react-google-maps";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getTravelAdvice } from "./actions";
import type { TravelAdvice, Alert } from "@/types";
import { MapView } from "@/components/map-view";

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
  CalendarClock,
} from "lucide-react";

const formSchema = z.object({
  origin: z.string().min(3, { message: "Origin must be at least 3 characters." }),
  destination: z.string().min(3, { message: "Destination must be at least 3 characters." }),
});

const AnalysisResult = ({
  analysis,
}: {
  analysis: TravelAdvice["routeAnalysis"];
}) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Route className="text-primary" /> AI Route Analysis
      </CardTitle>
      <CardDescription>{analysis.prediction}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
          <TrafficCone size={18} /> Current Traffic
        </h3>
        <p>{analysis.trafficAnalysis}</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
          <CloudRain size={18} /> Weather Impact
        </h3>
        <p>{analysis.weatherImpact}</p>
      </div>
    </CardContent>
  </Card>
);

const RecommendationResult = ({
  analysis,
}: {
  analysis: TravelAdvice["routeAnalysis"];
}) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Lightbulb className="text-primary" /> AI Recommendation
      </CardTitle>
      <CardDescription>Optimal travel advice based on current data.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-3">
          <span className="font-bold text-primary shrink-0 pt-0.5">Primary:</span>
          <span>{analysis.aiRecommendation.primary}</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="font-bold text-accent shrink-0 pt-0.5">Alternative:</span>
          <span>{analysis.aiRecommendation.alternative}</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="font-bold text-destructive shrink-0 pt-0.5">
            Avoid:
          </span>
          <span>{analysis.aiRecommendation.avoid}</span>
        </li>
      </ul>
      <Separator />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarClock size={16} />
        <span className="font-semibold">Best Departure:</span>
        <span>{analysis.bestDepartureTime}</span>
      </div>
    </CardContent>
  </Card>
);

const WeatherCard = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CloudSun className="text-primary" /> Weather Report
      </CardTitle>
      <CardDescription>Current weather conditions in Bengaluru.</CardDescription>
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="text-primary" /> Live Traffic Reports
        </CardTitle>
        <CardDescription>Real-time updates from various sources.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {reports.map((report, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <Info size={16} className="mt-1 text-muted-foreground shrink-0" />
              <span>{report}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const LoadingSkeletons = () => (
  <>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  </>
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
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
        });
      }
    });
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary tracking-tight">
              Namma Pulse
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI guide to navigating Bengaluru.
            </p>
          </div>

          <Card className="mb-6 shadow-lg">
            <CardContent className="p-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col sm:flex-row items-center gap-4"
                >
                  <div className="flex-grow w-full">
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Origin</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Origin" {...field} className="text-base"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-grow w-full">
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Destination</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Destination" {...field} className="text-base"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isPending}
                    size="lg"
                  >
                    {isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      "Get AI Route Advice"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {isPending && <LoadingSkeletons />}
            {advice?.routeAnalysis && (
              <>
                <AnalysisResult analysis={advice.routeAnalysis} />
                <RecommendationResult analysis={advice.routeAnalysis} />
              </>
            )}
            {!isPending && !advice && (
              <>
                <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                  <Route size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Ready for Adventure?</h3>
                  <p className="text-muted-foreground">
                    Enter your route to see AI-powered travel advice.
                  </p>
                </Card>
                <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                  <Lightbulb size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">
                    Get Smart Recommendations
                  </h3>
                  <p className="text-muted-foreground">
                    Our AI provides the best routes, times, and tips.
                  </p>
                </Card>
              </>
            )}
            <LiveReports />
            <WeatherCard />
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="text-primary" /> Visual Route Overview
              </CardTitle>
              <CardDescription>
                A glance at your travel route on the map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] md:h-[500px] rounded-lg overflow-hidden border">
                <MapView />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </APIProvider>
  );
}
