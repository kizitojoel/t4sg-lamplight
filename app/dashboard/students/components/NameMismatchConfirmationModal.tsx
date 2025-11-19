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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import type { NameMismatch, NameMismatchDecision } from "../utils/studentImporter";

interface NameMismatchConfirmationModalProps {
  open: boolean;
  mismatches: NameMismatch[];
  onConfirm: (decisions: Map<string, NameMismatchDecision>) => void;
  onCancel: () => void;
}

export function NameMismatchConfirmationModal({
  open,
  mismatches,
  onConfirm,
  onCancel,
}: NameMismatchConfirmationModalProps) {
  const [decisions, setDecisions] = useState<Map<string, NameMismatchDecision>>(new Map());
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editedNames, setEditedNames] = useState<Record<string, { firstName: string; lastName: string }>>({});

  // Initialize decisions map
  useEffect(() => {
    const initialDecisions = new Map<string, NameMismatchDecision>();
    for (const mismatch of mismatches) {
      if (!initialDecisions.has(mismatch.studentCode)) {
        initialDecisions.set(mismatch.studentCode, {
          studentCode: mismatch.studentCode,
          action: "skip", // Default to skip
        });
      }
    }
    setDecisions(initialDecisions);
  }, [mismatches]);

  const handleActionChange = (studentCode: string, action: "approve" | "skip" | "edit") => {
    const newDecisions = new Map(decisions);
    const decision = newDecisions.get(studentCode) ?? { studentCode, action: "skip" };

    if (action === "edit") {
      setEditingStudent(studentCode);
      const mismatch = mismatches.find((m) => m.studentCode === studentCode);
      if (mismatch) {
        setEditedNames((prev) => ({
          ...prev,
          [studentCode]: {
            firstName: mismatch.csvFirstName,
            lastName: mismatch.csvLastName,
          },
        }));
      }
      newDecisions.set(studentCode, { ...decision, action: "edit" });
    } else {
      setEditingStudent(null);
      newDecisions.set(studentCode, { ...decision, action });
    }

    setDecisions(newDecisions);
  };

  const handleEditNameChange = (studentCode: string, field: "firstName" | "lastName", value: string) => {
    setEditedNames((prev) => ({
      ...prev,
      [studentCode]: {
        ...(prev[studentCode] ?? { firstName: "", lastName: "" }),
        [field]: value,
      },
    }));
  };

  const handleSaveEdit = (studentCode: string) => {
    const edited = editedNames[studentCode];
    if (edited?.firstName?.trim() && edited?.lastName?.trim()) {
      const newDecisions = new Map(decisions);
      const decision = newDecisions.get(studentCode) ?? { studentCode, action: "edit" };
      newDecisions.set(studentCode, {
        ...decision,
        action: "edit",
        editedFirstName: edited.firstName.trim(),
        editedLastName: edited.lastName.trim(),
      });
      setDecisions(newDecisions);
      setEditingStudent(null);
    }
  };

  const handleApproveAll = () => {
    const newDecisions = new Map<string, NameMismatchDecision>();
    for (const mismatch of mismatches) {
      newDecisions.set(mismatch.studentCode, {
        studentCode: mismatch.studentCode,
        action: "approve",
      });
    }
    setDecisions(newDecisions);
    setEditingStudent(null);
  };

  const handleSkipAll = () => {
    const newDecisions = new Map<string, NameMismatchDecision>();
    for (const mismatch of mismatches) {
      newDecisions.set(mismatch.studentCode, {
        studentCode: mismatch.studentCode,
        action: "skip",
      });
    }
    setDecisions(newDecisions);
    setEditingStudent(null);
  };

  const handleConfirm = () => {
    // Validate all edit decisions have names
    for (const [studentCode, decision] of decisions.entries()) {
      if (decision.action === "edit") {
        const edited = editedNames[studentCode];
        if (!edited?.firstName?.trim() || !edited?.lastName?.trim()) {
          // If edit is incomplete, default to skip
          decision.action = "skip";
          decision.editedFirstName = undefined;
          decision.editedLastName = undefined;
        }
      }
    }
    onConfirm(decisions);
  };

  const approvedCount = Array.from(decisions.values()).filter((d) => d.action === "approve").length;
  const skippedCount = Array.from(decisions.values()).filter((d) => d.action === "skip").length;
  const editedCount = Array.from(decisions.values()).filter((d) => d.action === "edit").length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Name Mismatch Confirmation</DialogTitle>
          <DialogDescription>
            {mismatches.length} student{mismatches.length !== 1 ? "s" : ""} have name mismatches between the database
            and CSV. Please review and decide how to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Batch Actions */}
          <div className="flex gap-2 border-b pb-2">
            <Button variant="outline" size="sm" onClick={handleApproveAll}>
              Approve All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSkipAll}>
              Skip All
            </Button>
            <div className="text-muted-foreground ml-auto text-sm">
              Approved: {approvedCount} | Skipped: {skippedCount} | Edited: {editedCount}
            </div>
          </div>

          {/* Mismatches List */}
          <div className="space-y-3">
            {mismatches.map((mismatch) => {
              const decision = decisions.get(mismatch.studentCode) ?? {
                studentCode: mismatch.studentCode,
                action: "skip" as const,
              };
              const isEditing = editingStudent === mismatch.studentCode;
              const edited = editedNames[mismatch.studentCode];

              return (
                <div key={mismatch.studentCode} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 text-sm font-semibold">Student Code: {mismatch.studentCode}</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Database Name:</div>
                          <div className="font-medium">
                            {mismatch.dbFirstName} {mismatch.dbLastName}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">CSV Name:</div>
                          <div className="font-medium">
                            {mismatch.csvFirstName} {mismatch.csvLastName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 border-t pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`edit-first-${mismatch.studentCode}`} className="text-xs">
                            First Name
                          </Label>
                          <Input
                            id={`edit-first-${mismatch.studentCode}`}
                            value={edited?.firstName ?? ""}
                            onChange={(e) => handleEditNameChange(mismatch.studentCode, "firstName", e.target.value)}
                            placeholder="First Name"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-last-${mismatch.studentCode}`} className="text-xs">
                            Last Name
                          </Label>
                          <Input
                            id={`edit-last-${mismatch.studentCode}`}
                            value={edited?.lastName ?? ""}
                            onChange={(e) => handleEditNameChange(mismatch.studentCode, "lastName", e.target.value)}
                            placeholder="Last Name"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(mismatch.studentCode)}
                        disabled={!edited?.firstName?.trim() || !edited?.lastName?.trim()}
                      >
                        Save Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 border-t pt-2">
                      <Button
                        size="sm"
                        variant={decision.action === "approve" ? "default" : "outline"}
                        onClick={() => handleActionChange(mismatch.studentCode, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={decision.action === "skip" ? "default" : "outline"}
                        onClick={() => handleActionChange(mismatch.studentCode, "skip")}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        variant={decision.action === "edit" ? "default" : "outline"}
                        onClick={() => handleActionChange(mismatch.studentCode, "edit")}
                      >
                        Edit
                      </Button>
                      {decision.action === "edit" && edited && (
                        <span className="text-muted-foreground ml-2 self-center text-sm">
                          → {edited.firstName} {edited.lastName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel Import
          </Button>
          <Button onClick={handleConfirm}>Confirm & Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
