"use client";

import { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TypographyH3 } from "@/components/ui/typography";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { Checkbox } from "@radix-ui/react-checkbox";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent } from "react";

const studentInfoSchema = z.object({
  email: z.string(),
  phone: z.string(),
  address_street: z.string(),
  address_city: z.string(),
  address_state: z.string(),
  address_zip: z.string(),
  gender: z.string(),
  age: z.number(),
  ethnicity: z.boolean(),
  race: z.array(z.string()),
  country_of_birth: z.string(),
  native_language: z.string(),
  language_spoken_at_home: z.string(),
});

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInfoValues = z.infer<typeof studentInfoSchema>;

export default function InfoForm({ student }: { student: Student }) {
  const [editing, setEditing] = useState(false);

  const router = useRouter();

  const defaultValues = {
    email: student.email || "",
    phone: student.phone || "",
    address_street: student.address_street || "",
    address_city: student.address_city || "",
    address_state: student.address_state || "",
    address_zip: student.address_zip || "",
    gender: student.gender || "",
    age: student.age || 0,
    ethnicity: student.ethnicity_hispanic_latino || false,
    race: student.race || [],
    country_of_birth: student.country_of_birth || "",
    native_language: student.native_language || "",
    language_spoken_at_home: student.language_spoken_at_home || "",
  };

  const form = useForm<StudentInfoValues>({
    resolver: zodResolver(studentInfoSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: StudentInfoValues) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        email: data.email,
        phone: data.phone,
        address_street: data.address_street,
        address_city: data.address_city,
        address_state: data.address_state,
        address_zip: data.address_zip,
        gender: data.gender,
        age: data.age,
        ethnicity: data.ethnicity,
        race: data.race,
        country_of_birth: data.country_of_birth,
        native_language: data.native_language,
        language_spoken_at_home: data.language_spoken_at_home,
      })
      .eq("id", student.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setEditing(false);

    // Reset form values to the data values that have been processed by zod.
    // This way the user sees any changes that have occurred during transformation
    form.reset(data);

    // Router.refresh does not affect ProfileForm because it is a client component, but it will refresh the initials in the user-nav in the event of a username change
    router.refresh();

    return toast({
      title: "Profile updated successfully!",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
        <TypographyH3>Contact Info</TypographyH3>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Email Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Phone Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="address_street"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Street Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="address_city"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="address_state"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="State" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="address_zip"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Zip Code</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Zip Code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <TypographyH3>Demographics and Eligiblity</TypographyH3>
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Gender" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Age" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="ethnicity"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Hispanic or Latino</FormLabel>
                <FormControl>
                  <Checkbox />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Age" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="country_of_birth"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Country of Birth</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Country of Birth" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="native_language"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Native Language</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Native Language" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="language_spoken_at_home"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Language Spoken at Home</FormLabel>
                <FormControl>
                  <Input readOnly={!editing} placeholder="Language Spoken at Home" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
}
