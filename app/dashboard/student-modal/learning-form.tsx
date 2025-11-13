"use client";

import type { Database } from "@/lib/schema";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { useEffect, useRef, useState } from "react";

type Student = Database["public"]["Tables"]["students"]["Row"];
// type CoursePlacement = Database["public"]["Tables"]["course_placement"]["Row"];
// type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
type AssessmentResults = Database["public"]["Tables"]["assessment_results"]["Row"];
// type Program = Database["public"]["Tables"]["program"]["Row"];

export default function LearningForm({ student }: { student: Student }) {
  const supabase = createBrowserSupabaseClient();
  // const [course_placements, setCoursePlacements] = useState<CoursePlacement[]>();
  // const [programs, setPrograms] = useState<Program[]>();
  // const [assessments, setAssessments] = useState<Assessment[]>();
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults[]>();
  const [assessmentsDict, setAssessmentsDict] = useState<Record<string, string>>();

  const dataFetched = useRef<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      // const { data: coursePlacementsList, error: coursePlacementError } = await supabase
      //   .from("course_placement")
      //   .select();
      // const { data: programList, error: programError } = await supabase.from("program").select();
      const { data: assessmentList, error: assessmentError } = await supabase.from("assessments").select();
      const { data: assessmentResults, error: assessmentResultError } = await supabase
        .from("assessment_results")
        .select()
        .eq("student_id", student.id);

      // if (coursePlacementError)
      //   return toast({
      //     title: "Something went wrong.",
      //     description: coursePlacementError.message,
      //     variant: "destructive",
      //   });
      // else setCoursePlacements(coursePlacementsList);

      // if (programError)
      //   return toast({
      //     title: "Something went wrong.",
      //     description: programError.message,
      //     variant: "destructive",
      //   });
      // else setPrograms(programList);

      if (assessmentError)
        return toast({
          title: "Something went wrong.",
          description: assessmentError.message,
          variant: "destructive",
        });
      else {
        // setAssessments(assessmentList);
        setAssessmentsDict(Object.fromEntries(assessmentList.map((assessment) => [assessment.id, assessment.name])));
      }

      if (assessmentResultError)
        return toast({
          title: "Something went wrong.",
          description: assessmentResultError.message,
          variant: "destructive",
        });
      else setAssessmentResults(assessmentResults);
    };

    if (!dataFetched.current) {
      dataFetched.current = true;
      void fetchData();
    }
  }, [supabase, student.id]);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Test</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessmentResults == undefined
            ? ""
            : assessmentResults.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessmentsDict == undefined ? "" : assessmentsDict[assessment.assessment_id]}
                  </TableCell>
                  <TableCell className="text-right">{assessment.score}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
