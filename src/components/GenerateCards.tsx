import React from "react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import FlashCard from "./FlashCards";
import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import axios from "axios";

export const GenerateCards = () => {
  const [cards, setCards] = useState<{ question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  console.log(cards)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // First, extract text using Flask API
      const extractResponse = await axios.post(
        "https://web-rag.onrender.com/extract_text",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const extractedText = extractResponse.data.sentences[0];
    //   console.log("This is the extracted text", extractedText[0])

      if (!extractedText) {
        throw new Error("No text extracted from document");
      }

      // Then, generate questions using Next.js API
      const generateResponse = await fetch("/api/generateqn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!generateResponse.ok) throw new Error("Failed to generate questions");

      const data = await generateResponse.json();
      setCards(data.questions);
      toast({
        title: "Success",
        description: "Questions generated successfully",
        className: cn("bg-green-500 text-white"),
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full p-6">
      <div className="h-[85%] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : cards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto h-full">

            {cards.map((card, index) => (
              <FlashCard
                key={index}
                question={card.question}
                answer={card.answer}
                questionNo={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Upload className="h-12 w-12 mb-4" />
            <p>Upload a document to generate questions</p>
          </div>
        )}
      </div>

      <div className="h-[15%] flex items-center justify-center">
        <label className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".txt,.pdf"
          />
          Upload Document
        </label>
      </div>
    </div>
  );
};
