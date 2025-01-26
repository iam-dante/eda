"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function NewChat() {
  const router = useRouter();

  useEffect(() => {
    const newChatId = uuidv4();
    router.push(`/chat/${newChatId}`);
  }, [router]);

  return <div>Creating new chat...</div>;
}
