"use client";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from "./MarkdownRenderer";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  attachment?: string;
}

export default function Chat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachment) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: input.trim(),
        sender: "user",
        attachment: attachment ? URL.createObjectURL(attachment) : undefined,
      };
      setMessages([...messages, newMessage]);
      setInput("");
      setAttachment(null);

      try {
        const response = await fetch("http://127.0.0.1:5000/search", {
          
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ text: input }),
        });

        
        if (response.ok) {
          const data = await response.json();
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: attachment
              ? `I received your attachment: ${attachment.name}`
              : `${data["results"]}`,
            sender: "ai",
          };
          setMessages((prevMessages) => [...prevMessages, aiResponse]);
        } else {
          const errorData = await response.json();
          toast({
            description:
              errorData.error ||
              "An error occurred while processing your text.",
          });
        }
      } catch (error) {
        console.log(input);
        toast({
          className: cn(
            "top-4 right-0 flex fixed md:max-w-[420px] md:right-4"
          ),
          description: `Failed to connect to the server ${error}`,
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit

        toast({
          className: cn(
            "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4"
          ),
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });

        return;
      }
      setAttachment(file);
      toast({
        className: cn(
          "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4"
        ),
        title: "File attached",
        description: `${file.name} is ready to be sent.`,
      });
    }
  };

  return (
    <div key={chatId} className="h-screen md:ml-64  ">
      <div className="h-[90%] overflow-y-auto  py-8 px-64">
        <div className="space-y-2 flex flex-col min-h-full  w-full">
          {messages.map((message) => (
            <div key={message.id} className="grid justify-items-stretch ">
              <div
                className={`max-w-[70%] px-4 py-1 rounded-l-md rounded-tr-md font-sans font-medium ${
                  message.sender === "user"
                    ? "bg-gray-200 justify-self-end"
                    : "max-w-[90%] text-[17px] space-y-2"
                }`}
              >
                {message.sender === "ai" && <span>&#x2022; </span>}
                <MarkdownRenderer content={message.content} />
                {message.attachment && (
                  <div className="mt-2">
                    <a
                      href={message.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className=" h-[10%]  py-4 px-64">
        <form onSubmit={sendMessage} className="flex items-end w-full">
          <div className="w-full flex justify-center items-center">
            <div className="h-14 w-full bg-white rounded-full pl-6 pr-3 flex items-center border-2 border-black justify-between">
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.pdf,.doc,.docx"
              />
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  attachment
                    ? `${attachment.name} attached`
                    : "Type your message..."
                }
                className=" w-[94%] h-11 text-black font-sans font-medium focus:outline-none focus:ring-0 border-0"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mr-2"
              >
                <Paperclip className="h-6 w-6 -rotate-45 " />
              </button>
              <button
                type="submit"
                className="bg-black h-8 w-8 rounded-full flex justify-center items-center"
                onClick={() => {
                  handleFileChange;
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 22 22"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="size-4 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
      <Toaster />
    </div>
  );
}
