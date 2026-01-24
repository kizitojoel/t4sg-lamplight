"use client";

import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent, type MouseEvent } from "react";

// Props interface for lookup data from server
interface AddStudentFormProps {
  programs: { id: string; name: string }[];
  courses: { id: string; name: string }[];
}

const addStudentFormSchema = z.object({
  legal_first_name: z
    .string()
    .min(1, {
      message: "Legal first name is required.",
    })
    .max(50, {
      message: "Legal first name must not be longer than 30 characters.",
    })
    .transform((val) => val.trim()),
  legal_last_name: z
    .string()
    .min(1, {
      message: "Legal last name is required.",
    })
    .max(50, {
      message: "Legal last name must not be longer than 30 characters.",
    })
    .transform((val) => val.trim()),
  preferred_name: z
    .string()
    .max(50, {
      message: "Preferred name must not be longer than 30 characters.",
    })
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),
  phone: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),
  age: z
    .number()
    .min(1, {
      message: "Age must be at least 1.",
    })
    .nullable()
    .transform((val) => val ?? null),
  gender: z.enum(["Male", "Female", "Non-binary", "Other", "Prefer not to say"]).nullable(),
  address_street: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),

  address_city: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),

  address_state: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),

  address_zip: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),

  country_of_birth: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),

  language_spoken_at_home: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),

  native_language: z
    .string()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : (val?.trim() ?? null))),
  race: z.string().nullable().optional(),
  ethnicity_hispanic_latino: z.boolean().nullable(),
  // Use IDs for lookup tables
  program_id: z.string().min(1, { message: "Program is required." }),
  course_placement_id: z.string().min(1, { message: "Course placement is required." }),
  enrollment_status: z.enum(["active", "inactive"]).optional(),
});

type AddStudentFormValues = z.infer<typeof addStudentFormSchema>;

export default function AddStudentForm({ programs, courses }: AddStudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get default IDs from the first items in lookup tables
  const defaultProgramId = programs[0]?.id ?? "";
  const defaultCourseId = courses[0]?.id ?? "";

  // Default values for the form fields - all empty for new student
  const defaultValues = {
    legal_first_name: "",
    legal_last_name: "",
    preferred_name: null,
    email: null,
    phone: null,
    age: null,
    gender: null,
    address_street: null,
    address_city: null,
    address_state: null,
    address_zip: null,
    country_of_birth: null,
    language_spoken_at_home: null,
    native_language: null,
    race: null,
    ethnicity_hispanic_latino: null,
    program_id: defaultProgramId,
    course_placement_id: defaultCourseId,
    enrollment_status: "active" as const,
  };

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const router = useRouter();

  const onSubmit = async (_data: AddStudentFormValues) => {
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();

      // Transform the data to match database schema
      // Only using ID columns - enum columns will be removed from DB
      const transformedData = {
        legal_first_name: _data.legal_first_name,
        legal_last_name: _data.legal_last_name,
        preferred_name: _data.preferred_name,
        email: _data.email,
        phone: _data.phone,
        age: _data.age,
        gender: _data.gender,
        address_street: _data.address_street,
        address_city: _data.address_city,
        address_state: _data.address_state,
        address_zip: _data.address_zip,
        country_of_birth: _data.country_of_birth,
        language_spoken_at_home: _data.language_spoken_at_home,
        native_language: _data.native_language,
        race: _data.race ? [_data.race] : null,
        ethnicity_hispanic_latino: _data.ethnicity_hispanic_latino,
        enrollment_status: _data.enrollment_status,
        program_id: _data.program_id,
        course_placement_id: _data.course_placement_id,
      };

      const { error } = await supabase.from("students").insert(transformedData);

      if (error) {
        return toast({
          title: "Something went wrong.",
          description: error.message,
          variant: "destructive",
        });
      }

      // Reset form to default values
      form.reset(defaultValues);

      // Navigate back to students list
      router.push("/dashboard/students");

      return toast({
        title: "Student added successfully!",
      });
    } catch {
      return toast({
        title: "Something went wrong.",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    form.reset(defaultValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
        {/* Personal Information Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Personal Information</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="legal_first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter legal first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legal_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter legal last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preferred_name"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Preferred Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter preferred name (optional)" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>The name the student prefers to be called.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter phone number" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address Information Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Address Information</h2>

          <FormField
            control={form.control}
            name="address_street"
            render={({ field }) => (
              <FormItem className="max-w-lg">
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter street address" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="address_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter state" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ZIP code" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Background Information Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Background Information</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="country_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country of Birth</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter country of birth" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="native_language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Native Language</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter native language" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="language_spoken_at_home"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Language Spoken at Home</FormLabel>
                <FormControl>
                  <Input placeholder="Enter language spoken at home" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ethnicity_hispanic_latino"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked ? true : null)}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Hispanic or Latino</FormLabel>
                  <FormDescription>Check if the student identifies as Hispanic or Latino.</FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="race"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Race</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent side="bottom" position="popper" sideOffset={4} avoidCollisions={false}>
                    <SelectItem value="American Indian or Alaska Native">American Indian or Alaska Native</SelectItem>
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="Black or African American">Black or African American</SelectItem>
                    <SelectItem value="Native Hawaiian or Other Pacific Islander">
                      Native Hawaiian or Other Pacific Islander
                    </SelectItem>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Program Information Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Program Information</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="program_id"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Program *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom" position="popper" sideOffset={4} avoidCollisions={false}>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enrollment_status"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Enrollment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select enrollment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom" position="popper" sideOffset={4} avoidCollisions={false}>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="course_placement_id"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Course Placement *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course placement" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    side="bottom"
                    position="popper"
                    sideOffset={4}
                    avoidCollisions={false}
                    collisionPadding={100}
                  >
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Student..." : "Save"}
          </Button>
          <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
