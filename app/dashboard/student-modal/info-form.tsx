"use client";

import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypographyH3 } from "@/components/ui/typography";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import parsePhoneNumberFromString from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent, type JSX } from "react";

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInfoValues = z.infer<typeof studentInfoSchema>;
const genders = z.enum(["Male", "Female", "Non-binary", "Other", "Prefer not to say"]);
type Gender = Database["public"]["Enums"]["gender"];

const studentInfoSchema = z.object({
  email: z.email(),
  phone: z
    .string()
    .transform((arg, ctx) => {
      if (arg == "") return arg;
      const phone = parsePhoneNumberFromString(arg, {
        // set this to use a default country when the phone number omits country code
        defaultCountry: "US",

        // set to false to require that the whole string is exactly a phone number,
        // otherwise, it will search for a phone number anywhere within the string
        extract: false,
      });

      // when it's good
      if (phone?.isValid()) {
        return phone.number;
      }

      // when it's not
      ctx.addIssue({
        code: "custom",
        message: "Invalid phone number",
      });
      return z.NEVER;
    })
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  address_street: z.string(),
  address_city: z.string(),
  address_state: z.string(),
  address_zip: z.string().regex(RegExp(/\d{5}(-\d{4})?$/), "Please enter a correct ZIP Code."),
  gender: genders,
  age: z.number().min(0).max(130),
  ethnicity: z.boolean(),
  race: z.array(z.string()),
  country_of_birth: z.string(),
  native_language: z.string(),
  language_spoken_at_home: z.string(),
});

export default function InfoForm({
  student,
  updateFunctionAction,
}: {
  student: Student;
  updateFunctionAction: () => Promise<JSX.Element | undefined>;
}) {
  const [editing, setEditing] = useState(false);

  const router = useRouter();

  const defaultValues = {
    email: student.email ?? "",
    phone: student.phone ?? "",
    address_street: student.address_street ?? "",
    address_city: student.address_city ?? "",
    address_state: student.address_state ?? "",
    address_zip: student.address_zip ?? "",
    gender: student.gender ?? undefined,
    age: student.age ?? 0,
    ethnicity: student.ethnicity_hispanic_latino ?? false,
    race: student.race ?? [],
    country_of_birth: student.country_of_birth ?? "",
    native_language: student.native_language ?? "",
    language_spoken_at_home: student.language_spoken_at_home ?? "",
  };

  const form = useForm<StudentInfoValues>({
    resolver: zodResolver(studentInfoSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: StudentInfoValues) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("students")
      .update({
        email: data.email,
        phone: data.phone,
        address_street: data.address_street,
        address_city: data.address_city,
        address_state: data.address_state,
        address_zip: data.address_zip,
        gender: data.gender,
        age: data.age,
        ethnicity_hispanic_latino: data.ethnicity,
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
    // void updateFunctionAction();

    return toast({
      title: "Profile updated successfully!",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
        <div className="flex gap-2">
          <TypographyH3 className="mt-1">Contact Info</TypographyH3>
          <Button
            type="button"
            className="ml-auto block"
            onClick={() => {
              if (editing) {
                form.reset(defaultValues);
                setEditing(false);
              } else {
                setEditing(true);
              }
            }}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button type="submit" className={editing ? "bg-green-700 hover:bg-green-900" : "hidden"}>
            Save
          </Button>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input disabled={!editing} placeholder="Email Address" {...field} />
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
            // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
            const { value, ...rest } = field;
            return (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input disabled={!editing} placeholder="Phone Number" value={value ?? ""} {...rest} />
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
                  <Input disabled={!editing} placeholder="Street Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="address_city"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input disabled={!editing} placeholder="City" {...field} />
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
                    <Input disabled={!editing} placeholder="State" {...field} />
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
                    <Input disabled={!editing} placeholder="Zip Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        <TypographyH3>Demographics and Eligiblity</TypographyH3>
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(genders.parse(value))}
                  value={field.value}
                  disabled={!editing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a kingdom" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {genders.options.map((gender, index) => (
                        <SelectItem key={index} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                  <Input disabled={!editing} placeholder="Age" {...field} />
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
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked ? true : false)}
                    className="ml-1.5"
                    disabled={!editing}
                  />
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
                <CountryDropdown
                  placeholder="Country"
                  disabled={!editing}
                  defaultValue={field.value}
                  onChange={(country) => {
                    field.onChange(country.name);
                  }}
                />
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
                  <Input disabled={!editing} placeholder="Native Language" {...field} />
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
                  <Input disabled={!editing} placeholder="Language Spoken at Home" {...field} />
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
