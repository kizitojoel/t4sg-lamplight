"use client";

import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypographyH3 } from "@/components/ui/typography";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, type BaseSyntheticEvent } from "react";

const enrollment_statuses = z.enum(["active", "inactive"]);

const advisingSchema = z.object({
  enrollment_status: enrollment_statuses,
  course_placement: z.string().nullable(),
  program: z.string().nullable(),
});

type Student = Database["public"]["Tables"]["students"]["Row"];
type CoursePlacement = Database["public"]["Tables"]["course_placement"]["Row"];
type Program = Database["public"]["Tables"]["program"]["Row"];
type AdvisingValues = z.infer<typeof advisingSchema>;

export default function AdvisingForm({ student }: { student: Student }) {
  const [editing, setEditing] = useState(false);

  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [course_placements, setCoursePlacements] = useState<CoursePlacement[]>();
  const [programs, setPrograms] = useState<Program[]>();

  useEffect(() => {
    const fetchData = async () => {
      const { data: coursePlacementsList, error: coursePlacementError } = await supabase
        .from("course_placement")
        .select();
      const { data: programList, error: programError } = await supabase.from("program").select();

      if (coursePlacementError)
        return toast({
          title: "Something went wrong.",
          description: coursePlacementError.message,
          variant: "destructive",
        });
      else if (programError)
        return toast({
          title: "Something went wrong.",
          description: programError.message,
          variant: "destructive",
        });
      else {
        setCoursePlacements(coursePlacementsList);
        setPrograms(programList);
      }
    };

    void fetchData();
  }, [supabase]);

  const defaultValues = {
    enrollment_status: student.enrollment_status ?? "inactive",
    course_placement: student.course_placement_id,
    program: student.program_id,
  };

  const form = useForm<AdvisingValues>({
    resolver: zodResolver(advisingSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: AdvisingValues) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("students")
      .update({
        enrollment_status: data.enrollment_status,
        course_placement_id: data.course_placement,
        program_id: data.program,
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

  if (course_placements == undefined) {
    return <div>Loading list of courses...</div>;
  }

  if (programs == undefined) {
    return <div>Loadling list of programs...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
        <div className="flex gap-2">
          <TypographyH3 className="mt-1">Advising</TypographyH3>
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

        {/* <FormField
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
        /> */}
        <FormField
          control={form.control}
          name="enrollment_status"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Enrollment Status</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(enrollment_statuses.parse(value))}
                  value={field.value}
                  disabled={!editing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select enrollment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {enrollment_statuses.options.map((status, index) => (
                        <SelectItem key={index} value={status}>
                          {status}
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
          name="program"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <Select onValueChange={(value) => field.onChange(value)} value={field.value ?? ""} disabled={!editing}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
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
          name="course_placement"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Course Placement</FormLabel>
                <Select onValueChange={(value) => field.onChange(value)} value={field.value ?? ""} disabled={!editing}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select enrollment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {course_placements.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
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
      </form>
    </Form>
  );
}
