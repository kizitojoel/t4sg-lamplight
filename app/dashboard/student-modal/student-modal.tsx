import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useState } from "react";
import InfoForm from "./info-form";

export default async function StudentModal({ studentId }: { studentId: string }) {
  const supabase = createServerSupabaseClient();
  const { data: studentList, error } = await supabase.from("students").select().eq("id", studentId);
  const [open, setOpen] = useState<boolean>(false);

  if (error) {
    return <div>Error loading student: {error.message}</div>;
  }

  if (studentList[0] == null) {
    return <div>Failed to find student with id {studentId}</div>;
  }

  const student = studentList[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {student.legal_first_name} {student.legal_last_name}
          </DialogTitle>
          <DialogDescription>({student.preferred_name})</DialogDescription>
        </DialogHeader>
        <h1>
          {student.legal_first_name} {student.legal_last_name} ({student.preferred_name})
        </h1>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="learning-profile">Learning Profile</TabsTrigger>
            <TabsTrigger value="advising">Advising</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <InfoForm student={student}></InfoForm>
          </TabsContent>
          <TabsContent value="learning-profile">Learning Profile</TabsContent>
          <TabsContent value="advising">Advising</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
