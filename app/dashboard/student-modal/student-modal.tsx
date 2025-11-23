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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Database } from "@/lib/schema";
import { useEffect, useRef, useState } from "react";
import AdvisingForm from "./advising-form";
import InfoForm from "./info-form";
import LearningForm from "./learning-form";

type Student = Database["public"]["Tables"]["students"]["Row"];

export default function StudentModal({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createBrowserSupabaseClient();

  const [student, setStudent] = useState<Student>();

  const dataFetched = useRef<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      const { data: studentList, error } = await supabase.from("students").select("*").eq("id", studentId);

      if (error) return <div>Failed to get student with id: {studentId}</div>;
      else setStudent(studentList[0]);
    };

    if (!dataFetched.current) {
      dataFetched.current = true;
      void fetchData();
    }
  }, [studentId, supabase]);

  if (!student) return;

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="size-8 p-0">
            +
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {student.legal_first_name} {student.legal_last_name}
            </DialogTitle>
            <DialogDescription>{student.preferred_name}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Basic Info</TabsTrigger>
              <TabsTrigger value="learning-profile">Learning Profile</TabsTrigger>
              <TabsTrigger value="advising">Advising</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="p-2">
              <InfoForm student={student}></InfoForm>
            </TabsContent>
            <TabsContent value="learning-profile" className="p-2">
              <LearningForm student={student}></LearningForm>
            </TabsContent>
            <TabsContent value="advising" className="p-2">
              <AdvisingForm student={student}></AdvisingForm>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
