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
import { cn } from "@/lib/utils";
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const handleCopyToClipboard = () => {
    const text = filteredErrors
      .map(
        (error) =>
          `Row ${error.rowNumber}: ${error.studentName} (${error.studentCode ?? "N/A"}) - ${error.errorType ?? "Error"}: ${error.error}`,
      )
      .join("\n");
    void navigator.clipboard.writeText(text);
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getErrorTypeColor = (errorType?: string) => {
    switch (errorType) {
      case "DUPLICATE_STUDENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "VALIDATION_ERROR":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LOOKUP_FAILED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "INSERT_FAILED":
      case "BATCH_ERROR":
      case "UNKNOWN_ERROR":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const truncateMessage = (message: string, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + "...";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[1000px]">
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
                  <SelectItem value="all">All</SelectItem>
                  {errorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* System Errors Section */}
          {filteredSystemErrors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">System Errors</h3>
              <div className="border-destructive/20 bg-destructive/5 space-y-3 rounded-lg border p-4">
                {filteredSystemErrors.map((error, index) => (
                  <div key={index} className="bg-background/50 rounded-md p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
                          getErrorTypeColor(error.errorType),
                        )}
                      >
                        {error.errorType?.replace(/_/g, " ") ?? "System Error"}
                      </span>
                    </div>
                    <div className="text-muted-foreground mb-2 break-words">{error.error}</div>
                    {error.studentName && error.studentName !== "Unknown" && (
                      <div className="text-muted-foreground mt-2 text-xs">
                        <span className="font-medium">Affected:</span> {error.studentName}
                        {error.studentCode && <span className="ml-1 font-mono">({error.studentCode})</span>}
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
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="w-16 px-3 py-3 text-left font-semibold">Row</th>
                      <th className="w-48 min-w-[180px] px-4 py-3 text-left font-semibold">Student Name</th>
                      <th className="w-32 min-w-[120px] px-4 py-3 text-left font-semibold">Student Code</th>
                      <th className="w-40 min-w-[150px] px-4 py-3 text-left font-semibold">Error Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentErrors.map((error, index) => {
                      const isExpanded = expandedRows.has(index);
                      const errorLines = error.error.split("\n");
                      const shouldTruncate = error.error.length > 100;
                      const showFullMessage = isExpanded || !shouldTruncate;

                      return (
                        <tr
                          key={index}
                          className={cn(
                            "border-t transition-colors",
                            index % 2 === 0 ? "bg-background" : "bg-muted/30",
                            "hover:bg-muted/70",
                            shouldTruncate && "cursor-pointer",
                          )}
                          onClick={() => shouldTruncate && toggleRowExpansion(index)}
                        >
                          <td className="px-3 py-3 font-mono text-xs font-medium">{error.rowNumber}</td>
                          <td className="px-4 py-3 font-semibold">{error.studentName}</td>
                          <td className="px-4 py-3 font-mono text-xs">{error.studentCode ?? "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
                                getErrorTypeColor(error.errorType),
                              )}
                            >
                              {error.errorType?.replace(/_/g, " ") ?? "Error"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-0.5">
                                  {showFullMessage ? (
                                    errorLines.map((line, lineIndex) => {
                                      const isMainMessage = lineIndex === 0;
                                      const hasLabel = line.includes(":");

                                      return (
                                        <div
                                          key={lineIndex}
                                          className={cn(
                                            "text-sm leading-relaxed break-words",
                                            isMainMessage ? "text-foreground font-medium" : "text-muted-foreground",
                                          )}
                                        >
                                          {hasLabel && !isMainMessage ? (
                                            <span>
                                              <span className="font-medium">{line.split(":")[0]}:</span>
                                              <span
                                                className={cn(
                                                  "ml-1.5",
                                                  line.includes("Code:") || line.includes("Rows:") ? "font-mono" : "",
                                                )}
                                              >
                                                {line.split(":")[1]?.trim()}
                                              </span>
                                            </span>
                                          ) : (
                                            line
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-sm font-medium break-words">
                                      {truncateMessage(errorLines[0] ?? error.error)}
                                    </div>
                                  )}
                                </div>
                                {shouldTruncate && (
                                  <button
                                    className="text-primary hover:text-primary/80 shrink-0 text-xs font-medium underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpansion(index);
                                    }}
                                  >
                                    {isExpanded ? "Show less" : "Show more"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Errors Message */}
          {filteredErrors.length === 0 && (
            <div className="text-muted-foreground rounded-lg border p-8 text-center">No errors to display</div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard} disabled={filteredErrors.length === 0}>
              Copy to Clipboard
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV} disabled={filteredErrors.length === 0}>
              Download CSV
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
