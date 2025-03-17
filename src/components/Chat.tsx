"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Paperclip, Loader2, Ellipsis } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from "./MarkdownRenderer";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Tab } from "@headlessui/react"; // Update this line
import { v4 as uuidv4 } from "uuid";
import { useChat } from "@ai-sdk/react";
import { set } from "zod";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  attachment?: string;
}

export default function Chat({ chatId }: { chatId: string }) {
  const [isInitialUploadDone, setIsInitialUploadDone] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [collectionName, setCollectionName] = useState<string>(""); // new state
  const [document, setDocument] = useState<string>(""); // new state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileID = uuidv4();

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    
    body: {
      fileid: fileID,
      document: document,
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const production_url = "https://web-rag.onrender.com";
  const local_url = "http://127.0.0.1:5000";
  

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
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

      setIsUploading(true); // Start upload loading
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileID", fileID);

      try {
        const response = await axios.post(
          "http://127.0.0.1:5000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            params: {
              json: JSON.stringify({"fileID": fileID}), // Pass the JSON as a query parameter or another method
            },
          }
        );
        console.log(response);
        setAttachment(file);
        setIsInitialUploadDone(true);
        setUploadedFileName(file.name); // Store the filename
        setCollectionName(fileID); // Store the collection name
        setDocument(response.data.document); // Store the document name
        toast({
          className: cn(
            "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4 bg-green-700 text-white"
          ),
          title: "File uploaded",
          description: response.data.message,
        });
      } catch (error: any) {
        toast({
          className: cn(
            "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4"
          ),
          title: "Upload failed",
          description: error.response?.data?.error || "Failed to upload file.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false); // End upload loading
      }
    }
  };

  const customHandleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    handleSubmit: (
      event?: { preventDefault?: () => void },
      chatRequestOptions?: ChatRequestOptions
    ) => void,
    input: string,
    fileId: string
  ) => {
    e.preventDefault();

    await handleSubmit(e, {
      data: {
        messages: input, // Pass the user's input message
        fileid: fileId, // Pass the fileId as additional data
      },
    });
  };

  return (
    <div key={chatId} className="h-screen">
      <Tab.Group as={"div"} className="flex flex-col h-full">
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-2 mx-64">
          <Tab
            className={({ selected }) =>
              cn(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Tab 1
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Tab 2
          </Tab>
        </Tab.List>
        <Tab.Panels className="flex-1">
          <Tab.Panel className="h-full">
            <div className="h-full bg-yellow-300">
              <div className="h-[90%] overflow-y-auto px-64">
                <div className="space-y-2 flex flex-col min-h-full w-full max-w-[calc(100vw-512px)]">
                  {/* {messages.map((message) => (
                    <div
                      key={message.id}
                      className="grid justify-items-stretch"
                    >
                      <div
                        className={`px-4 py-1 rounded-l-md rounded-tr-md font-sans font-medium break-words whitespace-pre-wrap ${
                          message.sender === "user"
                            ? "bg-gray-200 justify-self-end max-w-[70%]"
                            : "max-w-[90%] text-[17px] space-y-2"
                        }`}
                        style={{
                          overflowWrap: "break-word",
                          wordWrap: "break-word",
                          hyphens: "auto",
                        }}
                      >
                        {message.sender === "ai" && (
                          <div>
                            {" "}
                            <div className="flex flex-col">
                              {" "}
                              <span>&#x2022;</span>{" "}
                            </div>
                          </div>
                        )}

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
                  ))} */}

                  {messages.map((message) => (
                    <div key={message.id} className="whitespace-pre-wrap">
                      {message.role === "user" ? "User: " : "AI: "}
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <div key={`${message.id}-${i}`}>{part.text}</div>
                            );
                        }
                      })}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex">
                      <Ellipsis className="h-8 w-8 text-black animate-pulse" />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>
              <div className="h-[10%] py-4 px-64">
                <form onSubmit={handleSubmit} className="flex items-end w-full">
                  <div className="w-full flex justify-center items-center">
                    <div className="h-14 w-full bg-white rounded-full pl-6 pr-3 flex items-center border-2 border-black justify-between">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        disabled={isLoading}
                        onChange={handleFileChange}
                        accept=".txt,.pdf,.doc,.docx"
                      />
                      <input
                        type="text"
                        disabled={
                          isLoading || (!isInitialUploadDone && !attachment)
                        } // Modified this line
                        value={input}
                        onChange={handleInputChange}
                        placeholder={
                          isUploading
                            ? "Uploading file..."
                            : !isInitialUploadDone && !attachment
                            ? "Upload a document to start a session..."
                            : uploadedFileName
                            ? `Working with: ${uploadedFileName}`
                            : "Type your message..."
                        }
                        className={cn(
                          "w-[94%] h-11 text-black font-sans font-medium focus:outline-none focus:ring-0 border-0",
                          !isInitialUploadDone &&
                            !attachment &&
                            "cursor-not-allowed"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mr-2"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        ) : (
                          <Paperclip className="h-6 w-6 -rotate-45" />
                        )}
                      </button>
                      <button
                        type="submit"
                        className={cn(
                          "bg-black h-8 w-8 rounded-full flex justify-center items-center",
                          !isInitialUploadDone &&
                            !attachment &&
                            "opacity-50 cursor-not-allowed"
                        )}
                        disabled={
                          isLoading || (!isInitialUploadDone && !attachment)
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
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
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <Toaster />
          </Tab.Panel>
          <Tab.Panel className="h-full">Content 2</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
