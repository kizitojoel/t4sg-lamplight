"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/lib/schema";
import React, { useState } from "react";

type ProgramEnum = (typeof Constants.public.Enums.program_enum)[number];
type CoursePlacementEnum = (typeof Constants.public.Enums.course_placement_enum)[number];

interface StudentImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File, program: ProgramEnum, coursePlacement: CoursePlacementEnum | null) => void;
}

export function StudentImportModal({ open, onOpenChange, onFileSelect }: StudentImportModalProps) {
  const [selectedProgram, setSelectedProgram] = useState<ProgramEnum | "">("");
  const [selectedCoursePlacement, setSelectedCoursePlacement] = useState<CoursePlacementEnum | "">("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const programs = Constants.public.Enums.program_enum;
  const coursePlacements = Constants.public.Enums.course_placement_enum;

  // For HCP, course placement is not required (will be read from CSV)
  // For ESOL, course placement is required
  const isHCP = selectedProgram === "HCP";
  const canChooseFile = selectedProgram !== "" && (isHCP || selectedCoursePlacement !== "");

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedProgram !== "") {
      // For HCP, pass null for coursePlacement (will be read from CSV)
      // For ESOL, pass the selected coursePlacement
      const coursePlacement = isHCP ? null : (selectedCoursePlacement as CoursePlacementEnum);
      if (!isHCP && !coursePlacement) {
        return; // ESOL requires course placement
      }
      onFileSelect(file, selectedProgram, coursePlacement);
      // Reset form
      setSelectedProgram("");
      setSelectedCoursePlacement("");
      onOpenChange(false);
    }
    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleCancel = () => {
    setSelectedProgram("");
    setSelectedCoursePlacement("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
            <DialogDescription>
              {isHCP
                ? "Select the program. Course placement will be read from the 'Placement Decision' column in your CSV file."
                : "Select the program and course placement for all students in your CSV file."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="program" className="text-sm font-medium">
                Program
              </label>
              <Select
                value={selectedProgram ?? undefined}
                onValueChange={(value) => {
                  setSelectedProgram(value as ProgramEnum);
                  // Reset course placement when program changes
                  setSelectedCoursePlacement("");
                }}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select Program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isHCP && (
              <div className="grid gap-2">
                <label htmlFor="course-placement" className="text-sm font-medium">
                  Course Placement
                </label>
                <Select
                  value={selectedCoursePlacement ?? undefined}
                  onValueChange={(value) => setSelectedCoursePlacement(value as CoursePlacementEnum)}
                >
                  <SelectTrigger id="course-placement">
                    <SelectValue placeholder="Select Course Placement" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursePlacements.map((placement) => (
                      <SelectItem key={placement} value={placement}>
                        {placement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleChooseFile} disabled={!canChooseFile}>
              Choose CSV File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
    </>
  );
}
