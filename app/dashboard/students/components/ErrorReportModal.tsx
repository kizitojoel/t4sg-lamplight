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
import Papa from "papaparse";
import { useState } from "react";

export interface ErrorInfo {
  rowNumber: number;
  studentName: string;
  studentCode?: string;
  error: string;
  errorType?: string;
}

interface ErrorReportModalProps {
  open: boolean;
  errors: ErrorInfo[];
  onClose: () => void;
}

export function ErrorReportModal({ open, errors, onClose }: ErrorReportModalProps) {
  const [selectedErrorType, setSelectedErrorType] = useState<string>("all");

  // Separate system errors from student-specific errors
  const systemErrorTypes = new Set(["INSERT_FAILED", "LOOKUP_FAILED", "BATCH_ERROR", "UNKNOWN_ERROR"]);

  // Group errors by type
  const errorsByType = errors.reduce(
    (acc, error) => {
      const type = error.errorType ?? "OTHER";
      acc[type] ??= [];
      acc[type].push(error);
      return acc;
    },
    {} as Record<string, ErrorInfo[]>,
  );

  const errorTypes = Object.keys(errorsByType).sort();
  const filteredErrors = selectedErrorType === "all" ? errors : (errorsByType[selectedErrorType] ?? []);

  const filteredStudentErrors = filteredErrors.filter((e) => {
    const type = e.errorType ?? "OTHER";
    return !systemErrorTypes.has(type);
  });

  const filteredSystemErrors = filteredErrors.filter((e) => {
    const type = e.errorType ?? "OTHER";
    return systemErrorTypes.has(type);
  });

  const handleDownloadCSV = () => {
    // Prepare CSV data
    const csvData = filteredErrors.map((error) => ({
      "Row Number": error.rowNumber,
      "Student Name": error.studentName,
      "Student Code": error.studentCode ?? "",
      "Error Type": error.errorType ?? "OTHER",
      "Error Message": error.error,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `import-errors-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Errors</DialogTitle>
          <DialogDescription>
            {errors.length} error{errors.length !== 1 ? "s" : ""} occurred during import. Review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Type Filter */}
          {errorTypes.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter by type:</span>
              <Select value={selectedErrorType} onValueChange={setSelectedErrorType}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select error type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({errors.length})</SelectItem>
                  {errorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")} ({errorsByType[type]?.length ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* System Errors Section */}
          {filteredSystemErrors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-destructive text-sm font-semibold">System Errors</h3>
              <div className="border-destructive/20 bg-destructive/5 space-y-2 rounded-lg border p-4">
                {filteredSystemErrors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <div className="text-destructive mb-1 font-medium">
                      {error.errorType?.replace(/_/g, " ") ?? "System Error"}
                    </div>
                    <div className="text-muted-foreground">{error.error}</div>
                    {error.studentName && error.studentName !== "Unknown" && (
                      <div className="mt-1 text-xs">
                        Affected: {error.studentName}
                        {error.studentCode && ` (${error.studentCode})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student-Specific Errors Table */}
          {filteredStudentErrors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Student-Specific Errors</h3>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Row</th>
                      <th className="px-4 py-2 text-left font-medium">Student Name</th>
                      <th className="px-4 py-2 text-left font-medium">Student Code</th>
                      <th className="px-4 py-2 text-left font-medium">Error Type</th>
                      <th className="px-4 py-2 text-left font-medium">Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentErrors.map((error, index) => (
                      <tr key={index} className="hover:bg-muted/50 border-t">
                        <td className="px-4 py-2 font-mono text-xs">{error.rowNumber}</td>
                        <td className="px-4 py-2 font-medium">{error.studentName}</td>
                        <td className="px-4 py-2 font-mono text-xs">{error.studentCode ?? "-"}</td>
                        <td className="px-4 py-2">
                          <span className="text-destructive text-xs font-medium">
                            {error.errorType?.replace(/_/g, " ") ?? "Error"}
                          </span>
                        </td>
                        <td className="px-4 py-2">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Errors Message */}
          {filteredErrors.length === 0 && (
            <div className="text-muted-foreground rounded-lg border p-8 text-center">No errors to display</div>
          )}

          {/* Error Summary */}
          {errorTypes.length > 1 && (
            <div className="text-muted-foreground text-sm">
              <strong>Summary:</strong>{" "}
              {errorTypes.map((type) => (
                <span key={type} className="ml-2">
                  {type.replace(/_/g, " ")}: {errorsByType[type]?.length ?? 0}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDownloadCSV} disabled={filteredErrors.length === 0}>
            Download CSV
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
