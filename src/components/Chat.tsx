"use client";

import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";


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

  const sendMessage = (e: React.FormEvent) => {
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
      // Here you would typically send the message to your backend or AI service
      // For this example, we'll just echo the message back as the AI
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: attachment
            ? `I received your attachment: ${attachment.name}`
            : `Echo: ${input.trim()}`,
          sender: "ai",
        };
        setMessages((prevMessages) => [...prevMessages, aiResponse]);
      }, 1000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachment(file);
      toast({
        title: "File attached",
        description: `${file.name} is ready to be sent.`,
      });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:ml-64">
      <div className="flex-1 overflow-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 p-2 rounded-lg ${
              message.sender === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
            } max-w-[70%]`}
          >
            {message.content}
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
        ))}
      </div>
      
      <form onSubmit={sendMessage} className="flex items-center">
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".txt,.pdf,.doc,.docx"
        />
        <button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="mr-2"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            attachment ? `${attachment.name} attached` : "Type your message..."
          }
          className="flex-1 mr-2"
        />
        <button type="submit">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
