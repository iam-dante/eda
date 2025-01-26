"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Sidebar() {
  const [chats, setChats] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const createNewChat = () => {
    const newChatId = uuidv4();
    const newChat = { id: newChatId, name: `Chat ${chats.length + 1}` };
    setChats([...chats, newChat]);
    router.push(`/chat/${newChatId}`);
  };


  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-gray-200 p-4 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? "w-64" : "w-0 md:w-64"
        } z-40`}
      >
        <div className="flex flex-col items-center justify-between mb-4 h-full ">
          <div className="flex-1 overflow-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                // variant="ghost"
                className="w-full justify-start mb-2"
                onClick={() => router.push(`/chat/${chat.id}`)}
              >
                {chat.name}
              </button>
            ))}
          </div>
          <button onClick={createNewChat} className="mb-4 mt-12 w-full bg-black text-white p-2 rounded-md place-self-end">
            {/* Icon for New Chat */}
            New Chat
          </button>
         
        </div>
      </div>
    </>
  );
}
