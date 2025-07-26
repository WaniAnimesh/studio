"use client";

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import Image from 'next/image';

const reportSchema = z.object({
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  department: z.string({ required_error: 'Please select a department.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function NewReportForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          toast({ title: 'Success', description: 'Location captured.' });
        },
        () => {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not get location.' });
        }
      );
    }
  };

  const onSubmit = async (data: ReportFormValues) => {
    if (!imageFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload an image.' });
      return;
    }
    if (!location) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please capture your location.' });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload image to Storage
      const imagePath = `reports/anonymous/${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, imagePath);
      await uploadBytes(storageRef, imageFile);

      // 2. Get image URL
      const imageUrl = await getDownloadURL(storageRef);

      // 3. Save report to Firestore
      await addDoc(collection(db, 'reports'), {
        description: data.description,
        department: data.department,
        imageUrl: imageUrl,
        location: new GeoPoint(location.lat, location.lon),
        status: 'Submitted',
        userId: 'anonymous',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Report submitted successfully!' });
      // Reset form
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      setLocation(null);
      if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a New Report</CardTitle>
        <CardDescription>Fill in the details of the civic issue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Image</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
            {imagePreview && (
              <div className="mt-2">
                <Image
                  src={imagePreview}
                  alt="Image preview"
                  width={200}
                  height={200}
                  className="rounded-md object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the issue in detail..."
              {...form.register('description')}
            />
            {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
             <Select onValueChange={(value) => form.setValue('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="BBMP">BBMP (Waste, Roads, Drains)</SelectItem>
                <SelectItem value="BESCOM">BESCOM (Electricity)</SelectItem>
                <SelectItem value="BWSSB">BWSSB (Water & Sewage)</SelectItem>
                <SelectItem value="BTP">Bengaluru Traffic Police</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.department && <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={handleLocation}>
                Get Current Location
              </Button>
              {location && (
                <p className="text-sm text-green-600">
                  Location Captured: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </p>
              )}
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
