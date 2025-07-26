"use client";

import React, { useState } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';

export function MapView() {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

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
        {/* Placeholder marker. In a real app, this would show origin/destination */}
        <AdvancedMarker position={position} />
      </Map>
    </div>
  );
}
