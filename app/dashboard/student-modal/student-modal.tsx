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

type Student = Database["public"]["Tables"]["students"]["Row"];

export default function StudentModal({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const supabase = createBrowserSupabaseClient();

  const [student, setStudent] = useState<Student>();

  useEffect(() => {
    const fetchData = async () => {
      const { data: studentList, error } = await supabase.from("students").select().eq("id", studentId);

      if (error) console.error(error);
      else setStudent(studentList[0]);
    };

    fetchData();
  }, []);

  const updateInfo = async () => {
    const { data: studentList, error } = await supabase.from("students").select().eq("id", studentId);

    if (error) console.error(error);
    else setStudent(studentList[0]);
  };

  if (!student) return;

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
            <TabsList className="mb-0.5">
              <TabsTrigger value="info" className="outline-accent hover:bg-accent cursor-pointer p-2 outline-2">
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="learning-profile"
                className="outline-accent hover:bg-accent cursor-pointer p-2 outline-2"
              >
                Learning Profile
              </TabsTrigger>
              <TabsTrigger value="advising" className="outline-accent hover:bg-accent cursor-pointer p-2 outline-2">
                Advising
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="outline-accent/50 bg-accent/50 p-2 outline-2">
              <InfoForm student={student} updateFunction={updateInfo}></InfoForm>
            </TabsContent>
            <TabsContent value="learning-profile">Learning Profile</TabsContent>
            <TabsContent value="advising">Advising</TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
