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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
        <p className="text-lg text-gray-600">Creating new chat...</p>
      </div>
    </div>
  );
}
