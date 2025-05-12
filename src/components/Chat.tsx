"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Paperclip, Loader2, Ellipsis } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react"; // Update this line
import { useChat } from "@ai-sdk/react";
import { GenerateCards } from "./GenerateCards";
import Link from "next/link";
import SimpleMarkdownRenderer from "./SimpleMarkdown";

export default function Chat({ chatId }: { chatId: string }) {
  const [isInitialUploadDone, setIsInitialUploadDone] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<string>("");
  const { toast } = useToast();

  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, status, isLoading } =
    useChat({
      body: {
        document: document,
      },
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // console.log(messages)

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
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileID", chatId);

      try {
        const response = await axios.post(
          "https://eda-server-production.up.railway.app/upload",
          // "http://127.0.0.1:5000/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setAttachment(file);
        setAttachmentUrl(URL.createObjectURL(file));
        setIsInitialUploadDone(true);
        setUploadedFileName(file.name);
        setDocument(response.data.document);
        toast({
          className: cn(
            "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4 bg-orange-700 text-white"
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
        setIsUploading(false);
      }
    }
  };

  return (
    <div key={chatId} className="relative h-screen py-4 bg-orange-50">
      <div className="absolute h-12 px-4 sm:px-8">
        <Link href={"/"}>
          <h1 className="font-extrabold text-4xl sm:text-5xl text-orange-600 font-barriecito hidden md:block">
            Eda
          </h1>
        </Link>
      </div>
      <TabGroup as={"div"} className="flex flex-col h-full">
        <TabList className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 rounded-md p-2 mx-2 sm:mx-4 md:mx-[40%] border-2 border-gray-500">
          <Tab
            className={({ selected }) =>
              cn(
                "w-full rounded-sm py-2.5 text-md font-semibold leading-5",
                "ring-white ring-opacity-60 ring-offset-2 focus:outline-none",
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
                "ring-white ring-opacity-60 ring-offset-2 focus:outline-none",
                selected
                  ? "bg-orange-600 shadow text-white"
                  : "text-black hover:bg-white/[0.12] hover:text-orange-600"
              )
            }
          >
            <h1 className="font-jet text-md">FlashCards</h1>
          </Tab>
        </TabList>

        <TabPanels className="flex-1 overflow-hidden">
          <TabPanel className="h-full py-4">
            <div className="h-full mt-2 overflow-hidden">
              <div className="h-[85%] overflow-y-auto px-2 sm:px-4 md:px-64">
                {/* {<SimpleMarkdownRenderer content={test} />} */}
                <div className="space-y-2 flex flex-col min-h-full w-full sm:md:max-w-[calc(100vw-512px)]">
                  {/* Show upload prompt if no document uploaded yet */}
                  {!isInitialUploadDone && !attachment && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center text-orange-600">
                      <div className="text-3xl mb-2 font-barriecito">📄</div>
                      <div className="font-semibold text-lg mb-1">
                        Upload a document to start chatting!
                      </div>
                      <div className="text-sm text-gray-700">
                        Please upload a file using the paperclip button below to interact with Eda.
                      </div>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="grid justify-items-stretch"
                    >
                      <div
                        className={`px-2 sm:px-3 md:px-4 py-1 rounded-l-md rounded-tr-md font-sans font-medium break-words whitespace-pre-wrap ${
                          message.role === "user"
                            ? "bg-orange-200 justify-self-end max-w-[95%] sm:max-w-[85%] md:max-w-[70%]"
                            : "max-w-[98%] sm:max-w-[95%] md:max-w-[90%] text-[15px] md:text-[17px] space-y-2"
                        }`}
                        style={{
                          overflowWrap: "break-word",
                          wordWrap: "break-word",
                          hyphens: "auto",
                        }}
                      >
                        {message.role === "assistant" && (
                          <div>
                            <div className="flex flex-col">
                              <h1 className="font-extrabold text-md text-orange-600 font-barriecito">
                                Eda
                              </h1>
                            </div>
                          </div>
                        )}

                        <SimpleMarkdownRenderer
                          content={message.content.trim()}
                        />

                        {message.role === "user" && attachmentUrl && (
                          <div className="">
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              {uploadedFileName || "View Attachment"}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {status == "submitted" && (
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                          <span className="text-orange-600">
                            Eda is Thinking
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {status == "streaming" && (
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                          <span className="text-orange-600">
                            Eda is typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="h-[15%] py-2 sm:py-4 px-2 sm:px-4 md:px-72">
                <form onSubmit={handleSubmit} className="flex items-end w-full">
                  <div className="w-full flex justify-center items-center">
                    <div className="h-14 sm:h-16 md:h-24 py-1 w-full bg-white rounded-md pl-2 sm:pl-3 md:pl-6 pr-1 sm:pr-2 md:pr-3 flex items-center border-2 border-black">
                      <div className="flex items-center w-full h-14 sm:h-24 py-5">
                        <input
                          type="text"
                          disabled={
                            isLoading || (!isInitialUploadDone && !attachment)
                          }
                          value={input}
                          onChange={handleInputChange}
                          placeholder={
                            isUploading
                              ? "Uploading..."
                              : !isInitialUploadDone && !attachment
                              ? "Upload document..."
                              : uploadedFileName
                              ? `File: ${uploadedFileName.slice(0, 20)}${
                                  uploadedFileName.length > 15 ? "..." : ""
                                }`
                              : "Type message..."
                          }
                          className={cn(
                            "w-full h-full text-black bg-white border-white font-sans font-medium focus:outline-none focus:ring-0 border-0 text-sm sm:text-base ",
                            !isInitialUploadDone &&
                              !attachment &&
                              "cursor-not-allowed"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mr-1 sm:mr-2"
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
                            "bg-orange-600 h-8 w-8 sm:h-9 sm:w-9 rounded-full flex justify-center items-center",
                            !isInitialUploadDone &&
                              !attachment &&
                              "cursor-not-allowed opacity-70"
                          )}
                          disabled={
                            isLoading || (!isInitialUploadDone && !attachment)
                          }
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
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
          </TabPanel>
          <TabPanel className="h-full">
            <GenerateCards />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
