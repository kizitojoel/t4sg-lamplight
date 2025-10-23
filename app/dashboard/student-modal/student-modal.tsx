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
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { Database } from "@/lib/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useEffect, useState } from "react";
import InfoForm from "./info-form";
import "./student-modal.css";

type Student = Database["public"]["Tables"]["students"]["Row"];

export default function StudentModal({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createBrowserSupabaseClient();

  const [studentList, setStudentList] = useState<Student>();

  useEffect(() => {
    const fetchData = async () => {
      const { data: studentList, error } = await supabase.from("students").select().eq("id", studentId);

      if (error) console.error(error);
      else setStudentList(studentList);
    };

    fetchData();
  }, []);

  if (!studentList || !Array.isArray(studentList)) return;
  const student: Student = studentList[0];

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>+</Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {student.legal_first_name} {student.legal_last_name}
            </DialogTitle>
            <DialogDescription>{student.preferred_name}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info" className="studentTab bg-primary text-primary-foreground text-sm">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="learning-profile" className="studentTab bg-primary text-primary-foreground text-sm">
                Learning Profile
              </TabsTrigger>
              <TabsTrigger value="advising" className="studentTab bg-primary text-primary-foreground text-sm">
                Advising
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <InfoForm student={student}></InfoForm>
            </TabsContent>
            <TabsContent value="learning-profile">Learning Profile</TabsContent>
            <TabsContent value="advising">Advising</TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
