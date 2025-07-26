"use client";

import React, { useState, useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';

type MapViewProps = {
  origin?: string;
  destination?: string;
};

const Directions = ({ origin, destination }: MapViewProps) => {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;
    setDirectionsService(new google.maps.DirectionsService());
    setDirectionsRenderer(new google.maps.DirectionsRenderer({ map }));
  }, [map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (origin && destination) {
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
        },
        (response, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
          } else {
            console.error(`Directions request failed due to ${status}`);
          }
        }
      );
    } else {
      directionsRenderer.setDirections({ routes: [] });
    }
  }, [directionsService, directionsRenderer, origin, destination]);

  return null;
};


export function MapView({ origin, destination }: MapViewProps) {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const map = useMap();
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);


  useEffect(() => {
    if (!map) return;
    const layer = new google.maps.TrafficLayer();
    layer.setMap(map);
    setTrafficLayer(layer);

    return () => {
      if (layer) {
        layer.setMap(null);
      }
    };
  }, [map]);


  const position = { lat: 12.9716, lng: 77.5946 }; // Bengaluru center

  return (
    <div className="w-full h-full relative">
       <div className="absolute top-2 right-2 z-10 space-x-2">
        <Button 
          size="sm"
          onClick={() => setMapType('roadmap')} 
          variant={mapType === 'roadmap' ? 'default' : 'secondary'}
          className="shadow-md"
        >
          Map
        </Button>
        <Button 
          size="sm"
          onClick={() => setMapType('satellite')} 
          variant={mapType === 'satellite' ? 'default' : 'secondary'}
          className="shadow-md"
        >
          Satellite
        </Button>
      </div>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={position}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="bengaluru-travel-map"
        mapTypeId={mapType}
      >
        <Directions origin={origin} destination={destination} />
      </Map>
    </div>
  );
}
