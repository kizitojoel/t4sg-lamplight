import { Database } from "@/lib/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import InfoForm from "./info-form";

type Student = Database["public"]["Tables"]["students"]["Row"];

export default function StudentModal({student} : {student: Student}) {
  return (
    <>
      <h1>
        {student.legal_first_name} {student.legal_last_name} ({student.preferred_name})
      </h1>
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Basic Info</TabsTrigger>
          <TabsTrigger value="learning-profile">Learning Profile</TabsTrigger>
          <TabsTrigger value="advising">Advising</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <InfoForm student={student}></InfoForm>
        </TabsContent>
        <TabsContent value="learning-profile">Learning Profile</TabsContent>
        <TabsContent value="advising">Advising</TabsContent>
      </Tabs>
    </>
  );
}
