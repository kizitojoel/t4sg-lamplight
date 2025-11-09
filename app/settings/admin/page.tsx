"use client";

import { PencilIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useState } from "react";

// Mock types
interface Course {
  id: number;
  name: string;
  program: string;
  status: string;
  assessments: string[];
}

interface Assessment {
  id: number;
  name: string;
  usedIn: string[];
}

// const courses

// Mock data
const mockCourses: Course[] = [
  {
    id: 1,
    name: "ESOL - Beginner Level 1: Part 1",
    program: "ESOL",
    status: "Active",
    assessments: ["Best Plus II", "DAR"],
  },
  {
    id: 2,
    name: "ESOL - Beginner Level 1: Part 2",
    program: "ESOL",
    status: "Active",
    assessments: ["Best Plus II", "DAR"],
  },
  {
    id: 3,
    name: "ESOL - Beginner Level 1: Part 3",
    program: "ESOL",
    status: "Active",
    assessments: ["Best Plus II", "DAR"],
  },
  {
    id: 4,
    name: "ESOL - Beginner Level 2: Part 1",
    program: "ESOL",
    status: "Active",
    assessments: ["Best Plus II", "DAR"],
  },
  {
    id: 5,
    name: "ESOL - Beginner Level 2: Part 2",
    program: "ESOL",
    status: "Active",
    assessments: ["Best Plus II", "DAR"],
  },
  {
    id: 6,
    name: "HCP - English Pre-TEAS part 1",
    program: "HCP",
    status: "Active",
    assessments: ["HCP - English Pre-TEAS Part 1 Final"],
  },
  {
    id: 7,
    name: "HCP - English Pre-TEAS part 2",
    program: "HCP",
    status: "Active",
    assessments: ["HCP - English Pre-TEAS Part 2 Final"],
  },
  { id: 8, name: "HCP - English TEAS", program: "HCP", status: "Active", assessments: ["HCP - English TEAS Final"] },
  { id: 9, name: "HCP - Math TEAS", program: "HCP", status: "Active", assessments: ["HCP - Math TEAS Final"] },
];

const mockAssessments: Assessment[] = [
  {
    id: 1,
    name: "Best Plus II",
    usedIn: [
      "ESOL - Beginner Level 1 Part 1",
      "ESOL - Beginner Level 1 Part 2",
      "ESOL - Beginner Level 1 Part 3",
      "ESOL - Beginner Level 2 Part 1",
      "ESOL - Beginner Level 2 Part 2",
    ],
  },
  {
    id: 2,
    name: "DAR",
    usedIn: [
      "ESOL - Beginner Level 1 Part 1",
      "ESOL - Beginner Level 1 Part 2",
      "ESOL - Beginner Level 1 Part 3",
      "ESOL - Beginner Level 2 Part 1",
      "ESOL - Beginner Level 2 Part 2",
    ],
  },
  { id: 3, name: "HCP - English Pre-TEAS Part 1 Final", usedIn: ["HCP - English Pre-TEAS part 1"] },
  { id: 4, name: "HCP - English Pre-TEAS Part 2 Final", usedIn: ["HCP - English Pre-TEAS part 2"] },
  { id: 5, name: "HCP - English TEAS Final", usedIn: ["HCP - English TEAS"] },
  { id: 6, name: "HCP - Math TEAS Final", usedIn: ["HCP - Math TEAS"] },
];

export default function AdminDashboard() {
  const [courseSearch, setCourseSearch] = useState("");
  const [assessmentSearch, setAssessmentSearch] = useState("");

  const groupedCourses = mockCourses.reduce((groups: Record<string, Course[]>, course) => {
    groups[course.program] ??= [];
    groups[course.program]!.push(course);
    return groups;
  }, {});

  return (
    <div className="space-y-12 p-6 md:p-10">
      {/* Programs & Courses Section */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Programs & Courses</h1>
          <div className="space-x-2">
            <button className="rounded-full bg-gray-200 px-4 py-1 text-sm">Add Program</button>
            <button className="rounded-full bg-gray-200 px-4 py-1 text-sm">Add Course</button>
          </div>
        </div>
        <input
          className="mt-4 w-full max-w-sm border p-2"
          placeholder="Search Programs & Courses"
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
        />
        <div className="mt-6 space-y-10">
          {Object.entries(groupedCourses).map(([programName, courses]) => (
            <div key={programName}>
              <h2 className="text-xl font-semibold">{programName}</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {courses
                  .filter((course) => course.name.toLowerCase().includes(courseSearch.toLowerCase()))
                  .map((course) => (
                    <div key={course.id} className={clsx("relative w-64 rounded-lg bg-gray-100 p-4 shadow")}>
                      <div className="text-sm font-semibold">{course.name}</div>
                      <div className="mt-1 text-xs text-gray-600">Status: {course.status}</div>
                      <div className="mt-2 text-xs">
                        <div className="font-semibold">Assessments:</div>
                        <ul className="list-inside list-disc">
                          {course.assessments.map((a, idx) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                      <button className="absolute right-2 bottom-2">
                        <PencilIcon className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessments Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Assessments</h2>
          <button className="rounded-full bg-gray-200 px-4 py-1 text-sm">Add Assessment</button>
        </div>
        <input
          className="mt-4 w-full max-w-sm border p-2"
          placeholder="Search Assessments"
          value={assessmentSearch}
          onChange={(e) => setAssessmentSearch(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-4">
          {mockAssessments
            .filter((a) => a.name.toLowerCase().includes(assessmentSearch.toLowerCase()))
            .map((assessment) => (
              <div key={assessment.id} className="relative w-64 rounded-lg bg-gray-100 p-4 shadow">
                <div className="text-sm font-semibold">{assessment.name}</div>
                <div className="mt-2 text-xs">
                  <div className="font-semibold">Used in:</div>
                  <ul className="list-inside list-disc">
                    {assessment.usedIn.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
                <button className="absolute right-2 bottom-2">
                  <PencilIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
