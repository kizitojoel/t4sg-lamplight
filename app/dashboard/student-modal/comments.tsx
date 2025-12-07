"use client";

import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Comment } from "@/lib/schema";
import { useEffect, useRef, useState } from "react";

export default function Comment({ comment }: { comment: Comment }) {
  const supabase = createBrowserSupabaseClient();

  const [commentAuthor, setCommentAuthor] = useState<string>();

  const dataFetched = useRef<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("profiles").select("display_name").eq("id", comment.author);

      // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
      if (error) {
        return toast({
          title: "Something went wrong.",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setCommentAuthor(data[0]?.display_name);
      }
    };

    if (!dataFetched.current) {
      dataFetched.current = true;
      void fetchData();
    }
  }, [supabase, comment.author]);

  if (!commentAuthor) {
    return "Fetching comments";
  }

  return (
    <p className="mt-auto mb-auto flex-auto">
      {commentAuthor} ({comment.timestamp}): {comment.comment_body}
    </p>
  );
}
