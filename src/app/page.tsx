
"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from "@vis.gl/react-google-maps";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { LocationInput } from "@/components/location-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CivicReporter } from "@/components/civic-reporter";

import {
  CloudSun,
  Route,
  Car,
  TrafficCone,
  TriangleAlert,
  Info,
  Lightbulb,
  CloudRain,
  ShieldAlert,
  CalendarClock,
  LoaderCircle,
  MapIcon,
} from "lucide-react";

const formSchema = z.object({
  origin: z
    .string()
    .min(3, { message: "Origin must be at least 3 characters." }),
  destination: z
    .string()
    .min(3, { message: "Destination must be at least 3 characters." }),
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
      <CardDescription>
        Optimal travel advice based on current data.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 text-sm">
      <div className="space-y-1">
        <span className="font-bold text-primary">Primary:</span>
        <p>{analysis.aiRecommendation.primary}</p>
      </div>
      <div className="space-y-1">
        <span className="font-bold text-accent">Alternative:</span>
        <p>{analysis.aiRecommendation.alternative}</p>
      </div>
      <div className="space-y-1">
        <span className="font-bold text-destructive">Avoid:</span>
        <p>{analysis.aiRecommendation.avoid}</p>
      </div>
      <Separator className="my-4"/>
      <div className="flex items-center gap-2 text-muted-foreground">
        <CalendarClock size={16} />
        <span className="font-semibold">Best Departure:</span>
        <span>{analysis.bestDepartureTime}</span>
      </div>
    </CardContent>
  </Card>
);

const WeatherCard = ({ weather }: { weather: TravelAdvice["weather"] }) => (
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
        <p className="text-2xl font-bold">{weather.temp}°C</p>
        <p className="text-muted-foreground">{weather.description}</p>
      </div>
    </CardContent>
  </Card>
);

const LiveReports = ({ reports }: { reports: string[] }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="text-primary" /> Live Traffic Reports
        </CardTitle>
        <CardDescription>
          Real-time updates from various sources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length > 0 ? (
          <ScrollArea className="h-48">
            <ul className="space-y-3">
              {reports.map((report, index) => (
                <li key={index} className="flex items-start gap-3 text-sm pr-4">
                  <Info
                    size={16}
                    className="mt-1 text-muted-foreground shrink-0"
                  />
                  <span>{report}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">
            No live reports available at the moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const getAlertVariant = (type: string) => {
  switch (type.toLowerCase()) {
    case "accident":
      return "destructive";
    case "road closure":
      return "destructive";
    case "congestion":
      return "default";
    case "weather warning":
      return "default";
    default:
      return "secondary";
  }
};

const PredictiveAlerts = ({ alerts }: { alerts: Alert[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <ShieldAlert className="text-primary" /> Predictive Alerts
      </CardTitle>
      <CardDescription>AI-powered alerts for your route.</CardDescription>
    </CardHeader>
    <CardContent>
      {alerts.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {alerts.map((alert, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger>
                <div className="flex items-center gap-2 text-left">
                  <TriangleAlert className="text-destructive shrink-0" />
                  <span>
                    {alert.location}: {alert.type}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>{alert.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant={getAlertVariant(alert.type)}>
                    {alert.type}
                  </Badge>
                  <Badge variant="secondary">
                    Relevance: {Math.round(alert.relevance * 100)}%
                  </Badge>
                  <Badge variant="secondary">
                    Confidence: {Math.round(alert.confidence * 100)}%
                  </Badge>
                </div>
                <Separator />
                <p className="text-sm font-semibold">
                  Recommended Action:{" "}
                  <span className="font-normal">{alert.recommendedAction}</span>
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-sm text-muted-foreground">
          No predictive alerts for your route at the moment.
        </p>
      )}
    </CardContent>
  </Card>
);

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
      </CardHeader>
      <CardContent className="flex gap-4 items-center">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  </>
);

const PageContent = () => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [advice, setAdvice] = useState<TravelAdvice | null>(null);
  const [route, setRoute] = useState<{
    origin: string;
    destination: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      setAdvice(null);
      setRoute(null);
      try {
        const result = await getTravelAdvice(values);
        setAdvice(result);
        setRoute(values);
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
  };

  return (
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
                          <LocationInput
                            placeholder="Enter Origin"
                            onPlaceSelect={(place) =>
                              field.onChange(place?.formatted_address || "")
                            }
                          />
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
                          <LocationInput
                            placeholder="Enter Destination"
                            onPlaceSelect={(place) =>
                              field.onChange(place?.formatted_address || "")
                            }
                          />
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
          {advice && (
            <>
              <AnalysisResult analysis={advice.routeAnalysis} />
              <RecommendationResult analysis={advice.routeAnalysis} />
              <LiveReports reports={advice.liveTrafficReports} />
              <WeatherCard weather={advice.weather} />
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
              <LiveReports reports={[]} />
              <WeatherCard
                weather={{
                  temp: 28,
                  description: "Partly Cloudy",
                  icon: "02d",
                  wind_speed: 0,
                }}
              />
            </>
          )}
        </div>

        {advice?.predictiveAlerts?.alerts &&
          advice.predictiveAlerts.alerts.length > 0 && (
            <div className="mb-6">
              <PredictiveAlerts alerts={advice.predictiveAlerts.alerts} />
            </div>
          )}

        <Card className="shadow-lg mb-6">
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
              <MapView
                origin={route?.origin}
                destination={route?.destination}
              />
            </div>
          </CardContent>
        </Card>

        <CivicReporter />
        
        <Card className="shadow-lg mt-6">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-semibold mb-2">Braess' Paradox (in progress):</h3>
              <p className="text-sm text-muted-foreground">
                Is the observation that adding one or more roads to a road network can slow down overall traffic flow through it.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/bengaluru-travel-advisory.appspot.com/o/braess-paradox.png?alt=media&token=e9f4a9c6-1e4e-4e89-8059-1e967a983445"
                alt="Braess' Paradox visualization of Bengaluru map"
                width={600}
                height={400}
                className="rounded-lg object-cover"
                data-ai-hint="city map traffic"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">
          Google Maps API key is missing. Please add it to your environment
          variables.
        </p>
      </div>
    );
  }
  return (
    <APIProvider apiKey={apiKey}>
      <PageContent />
    </APIProvider>
  );
}
