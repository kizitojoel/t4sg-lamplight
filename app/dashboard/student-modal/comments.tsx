"use client";

import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { useEffect, useRef, useState } from "react";

interface CommentJson {
  author?: unknown;
  timestamp?: unknown;
  comment_body?: unknown;
}

export default function Comment({ comment }: { comment: CommentJson }) {
  const supabase = createBrowserSupabaseClient();

  const normalizeComment = (raw: CommentJson) => {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const obj = raw as Record<string, unknown>;
      return {
        author: typeof obj.author === "string" ? obj.author : "",
        timestamp: typeof obj.timestamp === "string" || typeof obj.timestamp === "number" ? obj.timestamp : "",
        comment_body: typeof obj.comment_body === "string" ? obj.comment_body : "",
      };
    }
    return { author: "", timestamp: "", comment_body: "" };
  };

  const safeComment = normalizeComment(comment);
  const [commentAuthor, setCommentAuthor] = useState<string>("");
  const authorId = safeComment.author;

  const dataFetched = useRef<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      if (!authorId) {
        return;
      }
      const { data, error } = await supabase.from("profiles").select("display_name").eq("id", authorId).maybeSingle();

      // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
      if (error) {
        return toast({
          title: "Something went wrong.",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setCommentAuthor(data?.display_name ?? "Unknown");
      }
    };

    if (!dataFetched.current) {
      dataFetched.current = true;
      void fetchData();
    }
  }, [supabase, authorId]);

  if (!commentAuthor) {
    return "Fetching comments";
  }

  return (
    <p className="mt-auto mb-auto flex-auto">
      {commentAuthor} ({String(safeComment.timestamp)}): {safeComment.comment_body}
    </p>
  );
}
