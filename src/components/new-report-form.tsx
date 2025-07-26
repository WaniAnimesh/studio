"use client";

import React, { useState, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateDescriptionForImage } from '@/app/actions';
import imageCompression from 'browser-image-compression';


import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import Image from 'next/image';
import { LoaderCircle } from 'lucide-react';

const reportSchema = z.object({
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  department: z.string({ required_error: 'Please select a department.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const DEPARTMENTS = ["BBMP", "BESCOM", "BWSSB", "BTP", "Other"];

export function NewReportForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, startAiTransition] = useTransition();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: '',
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set preview immediately with original image
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);

      // Compress image for AI analysis and storage
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile); // Store compressed file for upload

        const compressedReader = new FileReader();
        compressedReader.onloadend = () => {
            const compressedDataUri = compressedReader.result as string;
            // Also use the compressed version for the preview to save space in Firestore
            setImagePreview(compressedDataUri); 
            startAiTransition(async () => {
                form.setValue('description', 'Generating description...');
                form.setValue('department', '');
                const result = await generateDescriptionForImage(compressedDataUri);
                form.setValue('description', result.description);
                
                if (DEPARTMENTS.includes(result.department)) {
                  form.setValue('department', result.department);
                } else {
                   form.setValue('department', 'Other');
                }
              });
        };
        compressedReader.readAsDataURL(compressedFile);

      } catch (error) {
        console.error('Image compression failed:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not process image.' });
        // Fallback to original file if compression fails
        setImageFile(file);
      }
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
    if (!imagePreview) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload an image.' });
      return;
    }
    if (!location) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please capture your location.' });
      return;
    }

    setIsLoading(true);
    try {
      // The image upload logic is removed. We will save the data URI directly.
      // // 1. Upload image to Storage (now using compressed image)
      // const imagePath = `reports/anonymous/${Date.now()}-${imageFile.name}`;
      // const storageRef = ref(storage, imagePath);
      // await uploadBytes(storageRef, imageFile);

      // // 2. Get image URL
      // const imageUrl = await getDownloadURL(storageRef);

      // 3. Save report to Firestore
      await addDoc(collection(db, 'reports'), {
        description: data.description,
        department: data.department,
        imageUrl: imagePreview, // Save the base64 data URI
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
        <CardDescription>Fill in the details of the civic issue. You can upload a photo and our AI will help write a description and assign a department.</CardDescription>
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
            <div className="relative">
              <Textarea
                placeholder="Describe the issue in detail..."
                {...form.register('description')}
                disabled={isAiLoading}
              />
              {isAiLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <LoaderCircle className="animate-spin text-primary" />
                </div>
              )}
            </div>
            {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
             <Select 
                value={form.watch('department')} 
                onValueChange={(value) => form.setValue('department', value)}
                disabled={isAiLoading}
              >
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
          
          <Button type="submit" disabled={isLoading || isAiLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
