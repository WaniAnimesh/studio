"use client";

import { useRef, useEffect } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';

type LocationInputProps = {
  placeholder: string;
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
};

export function LocationInput({ placeholder, onPlaceSelect }: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  
  useEffect(() => {
    if (!places || !inputRef.current) return;

    const autocomplete = new places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
        // You can restrict search to a specific area if needed
        // componentRestrictions: { country: 'in' }, 
    });

    const listener = autocomplete.addListener('place_changed', () => {
      onPlaceSelect(autocomplete.getPlace());
    });
    
    return () => {
      // It's important to remove the listener when the component unmounts
      // to avoid memory leaks.
      if (listener) {
        listener.remove();
      }
    };

  }, [places, onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      className="text-base"
    />
  );
}
