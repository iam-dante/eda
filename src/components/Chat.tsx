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
import { useChat } from "@ai-sdk/react";

export default function Chat({ chatId }: { chatId: string }) {
  const [isInitialUploadDone, setIsInitialUploadDone] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<string>("");
  const { toast } = useToast();


  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    // api: "/api/chat",
    body: {
      // Your additional argument here
      document: document,
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const production_url = "https://web-rag.onrender.com";
  const local_url = "http://127.0.0.1:5000";

  // const sendMessage = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (input.trim() || attachment) {
  //     setIsLoading(true);
  //     const newMessage: Message = {
  //       id: Date.now().toString(),
  //       content: input.trim(),
  //       sender: "user",
  //       attachment: attachment ? URL.createObjectURL(attachment) : undefined,
  //     };
  //     setMessages([...messages, newMessage]);
  //     setInput("");
  //     setAttachment(null);

  //     try {
  //       const response = await fetch("http://127.0.0.1:5000/search", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //         },
  //         body: JSON.stringify({ text: input }),
  //       });

  //       let data;
  //       const contentType = response.headers.get("content-type");
  //       if (contentType && contentType.includes("application/json")) {
  //         data = await response.json();
  //       } else {
  //         const textResponse = await response.text();
  //         throw new Error(`Invalid response format: ${textResponse}`);
  //       }

  //       if (response.ok) {
  //         const aiResponse: Message = {
  //           id: (Date.now() + 1).toString(),
  //           content:
  //             data["results"] || "Sorry, I couldn't process that request.",
  //           sender: "ai",
  //         };
  //         setMessages((prevMessages) => [...prevMessages, aiResponse]);
  //       } else {
  //         toast({
  //           className: cn(
  //             "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4"
  //           ),
  //           title: "Error",
  //           description:
  //             data.error || "An error occurred while processing your request.",
  //           variant: "destructive",
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error details:", error);
  //       toast({
  //         className: cn("top-4 right-0 flex fixed md:max-w-[420px] md:right-4"),
  //         title: "Error",
  //         description:
  //           error instanceof Error
  //             ? `Failed to process request: ${error.message}`
  //             : "An unexpected error occurred",
  //         variant: "destructive",
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

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

      try {
        const response = await axios.post(
          "http://127.0.0.1:5000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setAttachment(file);
        setIsInitialUploadDone(true);
        setUploadedFileName(file.name); // Store the filename
        setDocument(response.data.document);
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

  return (
    <div key={chatId} className="h-screen py-4">
      <Tab.Group as={"div"} className="flex flex-col h-full ">
        <Tab.List className="flex space-x-1 rounded-md  p-2 mx-[40%] border-2 border-gray-500">
          <Tab
            className={({ selected }) =>
              cn(
                "w-full rounded-sm py-2.5 text-md font-semibold leading-5",
                "ring-white ring-opacity-60 ring-offset-2  focus:outline-none",
                selected
                  ? "bg-orange-600 shadow text-white"
                  : "text-black hover:bg-white/[0.12] hover:text-orange-600"
              )
            }
          >
            <h1 className="font-jet text-md">Chat</h1>
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                "w-full rounded-sm py-2.5 text-md font-semibold leading-5",
                "ring-white ring-opacity-60 ring-offset-2  focus:outline-none",
                selected
                  ? "bg-orange-600 shadow text-white"
                  : "text-black hover:bg-white/[0.12] hover:text-orange-600"
              )
            }
          >
            <h1 className="font-jet text-md">Create Question</h1>
          </Tab>
        </Tab.List>
        <Tab.Panels className="flex-1 overflow-hidden">
          <Tab.Panel className="h-full">
            <div className="h-full bg-yellow-300 mt-2 overflow-hidden">
              <div className="h-[85%] overflow-y-auto px-64">
                <div className="space-y-2 flex flex-col min-h-full w-full max-w-[calc(100vw-512px)]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="grid justify-items-stretch"
                    >
                      <div
                        className={`px-4 py-1 rounded-l-md rounded-tr-md font-sans font-medium break-words whitespace-pre-wrap ${
                          message.role === "user"
                            ? "bg-gray-200 justify-self-end max-w-[70%]"
                            : "max-w-[90%] text-[17px] space-y-2"
                        }`}
                        style={{
                          overflowWrap: "break-word",
                          wordWrap: "break-word",
                          hyphens: "auto",
                        }}
                      >
                        {message.role === "assistant" && (
                          <div>
                            {" "}
                            <div className="flex flex-col">
                              {" "}
                              <span>&#x2022;</span>{" "}
                            </div>
                          </div>
                        )}

                        <MarkdownRenderer content={message.content} />
                        {attachment && (
                          <div className="mt-2">
                            <a
                              href={attachment}
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

                  {isLoading && (
                    <div className="flex">
                      <Ellipsis className="h-8 w-8 text-black animate-pulse" />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>
              <div className="h-[15%] py-4 px-72">
                <form onSubmit={handleSubmit} className="flex items-end w-full">
                  <div className="w-full flex justify-center items-center">
                    <div className="h-24 w-full bg-white rounded-md pl-6 pr-3 flex items-center border-2 border-black justify-between">
                      <div className="flex items-center w-full">
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
                            "w-full h-22 text-black bg-white border-white font-sans font-medium focus:outline-none focus:ring-0 border-0",
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
                            "bg-orange-600 h-9 w-9 rounded-full flex justify-center items-center",
                            !isInitialUploadDone &&
                              !attachment &&
                              "cursor-not-allowed opacity-70"
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
                        <Input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          disabled={isLoading}
                          onChange={handleFileChange}
                          accept=".txt,.pdf,.doc,.docx"
                        />
                      </div>
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
