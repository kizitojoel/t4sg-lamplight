"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

type Student = Database["public"]["Tables"]["students"]["Row"];
type Assessment = Database["public"]["Tables"]["assessments"]["Row"];

const addExamScheme = z.object({
  assessment: z.string(),
  score: z.coerce.number<number>().min(0).max(100),
  date: z.string(),
});

type AddExamValues = z.infer<typeof addExamScheme>;

export default function AddExamModal({
  student,
  assessments,
  updateLearningAction,
}: {
  student: Student;
  assessments: Assessment[];
  updateLearningAction: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const date = new Date();

  const defaultValues = {
    asessment: "",
    score: 100,
    date: date.toISOString().split("T")[0],
  };

  const form = useForm<AddExamValues>({
    resolver: zodResolver(addExamScheme),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: AddExamValues) => {
    const { error } = await supabase
      .from("assessment_results")
      .insert({
        assessment_id: data.assessment,
        student_id: student.id,
        score: data.score,
        created_at: data.date,
      })
      .eq("id", student.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    // Reset form values to the data values that have been processed by zod.
    // This way the user sees any changes that have occurred during transformation
    form.reset(data);

    // Router.refresh does not affect ProfileForm because it is a client component, but it will refresh the initials in the user-nav in the event of a username change
    router.refresh();

    setOpen(false);

    updateLearningAction();

    return toast({
      title: "Test logged successfully!",
    });
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="ml-auto block">
            Add Exam
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add Test</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input placeholder="Date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="assessment"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Assessment</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an exam" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {assessments.map((assessment, index) => (
                              <SelectItem key={index} value={assessment.id}>
                                {assessment.name}
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
                name="score"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Score</FormLabel>
                      <FormControl>
                        <Input placeholder="Score" type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
