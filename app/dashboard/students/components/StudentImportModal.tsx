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
import type { LookupItem } from "@/lib/lookup-data";
import React, { useState } from "react";

interface StudentImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File, programId: string, programName: string, coursePlacementId: string | null) => void;
  programs: LookupItem[];
  coursePlacements: LookupItem[];
}

export function StudentImportModal({
  open,
  onOpenChange,
  onFileSelect,
  programs,
  coursePlacements,
}: StudentImportModalProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedCoursePlacementId, setSelectedCoursePlacementId] = useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Find the selected program to check if it's HCP
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // For HCP, course placement is not required (will be read from CSV)
  // For ESOL, course placement is required
  const isHCP = selectedProgram?.name === "HCP";
  const canChooseFile = selectedProgramId !== "" && (isHCP || selectedCoursePlacementId !== "");

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedProgramId !== "" && selectedProgram) {
      // For HCP, pass null for coursePlacement (will be read from CSV)
      // For ESOL, pass the selected coursePlacement ID
      const coursePlacementId = isHCP ? null : selectedCoursePlacementId;
      if (!isHCP && !coursePlacementId) {
        return; // ESOL requires course placement
      }
      onFileSelect(file, selectedProgramId, selectedProgram.name, coursePlacementId);
      // Reset form
      setSelectedProgramId("");
      setSelectedCoursePlacementId("");
      onOpenChange(false);
    }
    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleCancel = () => {
    setSelectedProgramId("");
    setSelectedCoursePlacementId("");
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
                value={selectedProgramId || undefined}
                onValueChange={(value) => {
                  setSelectedProgramId(value);
                  // Reset course placement when program changes
                  setSelectedCoursePlacementId("");
                }}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select Program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
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
                  value={selectedCoursePlacementId || undefined}
                  onValueChange={(value) => setSelectedCoursePlacementId(value)}
                >
                  <SelectTrigger id="course-placement">
                    <SelectValue placeholder="Select Course Placement" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursePlacements.map((placement) => (
                      <SelectItem key={placement.id} value={placement.id}>
                        {placement.name}
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
