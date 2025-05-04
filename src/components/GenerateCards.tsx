import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import FlashCard from "./FlashCards";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Upload,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import { Listbox } from "@headlessui/react";

const questionOptions = [
  { value: 10, label: "10 Questions" },
  { value: 15, label: "15 Questions" },
  { value: 20, label: "20 Questions" },
];

export const GenerateCards = () => {
  // Add explanation to the card type
  const [cards, setCards] = useState<
    { question: string; answer: string; explanation?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(questionOptions[0].value);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // First, extract text using Flask API
      const extractResponse = await axios.post(
        "https://eda-server-production.up.railway.app/extract_text",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const extractedText = extractResponse.data.sentences[0];

      if (!extractedText) {
        throw new Error("No text extracted from document");
      }
      const generateResponse = await fetch("/api/generateqn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText, count: questionCount }),
      });

      if (!generateResponse.ok) throw new Error("Failed to generate questions");

      const data = await generateResponse.json();
      setCards(
        data.questions.map((q: any) => ({
          question: q.question,
          answer: q.answer,
          explanation: q.explanation,
        }))
      );
      setCurrentIndex(0); 
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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : prev));
  };

  return (
    <div className="flex-1 h-full p-6">
      <div className="flex items-center justify-end mb-4 px-12">
        {/* Headless UI Dropdown */}
        <div className="w-40">
          <Listbox value={questionCount} onChange={setQuestionCount}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white border border-gray-300 py-2 pl-4 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                <span className="block truncate">
                  {
                    questionOptions.find((o) => o.value === questionCount)
                      ?.label
                  }
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                {questionOptions.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      cn(
                        "cursor-pointer select-none relative py-2 pl-10 pr-4",
                        active
                          ? "bg-orange-100 text-orange-900"
                          : "text-gray-900"
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={cn(
                            "block truncate",
                            selected && "font-medium"
                          )}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
                            ✓
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
      </div>
      <div className="h-[85%] flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex justify-center items-center h-full w-full">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : cards.length > 0 ? (
          <div className="flex flex-col items-center w-full h-full justify-center px-48">
            <div className="flex items-center justify-center w-full mb-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  currentIndex === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                )}
                aria-label="Previous"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="mx-4 flex-1 flex justify-center items-center px-24">
                <FlashCard
                  key={currentIndex}
                  question={cards[currentIndex].question}
                  explanation={cards[currentIndex].explanation}
                  answer={cards[currentIndex].answer}
                  questionNo={currentIndex}
                />
              </div>
              <button
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  currentIndex === cards.length - 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                )}
                aria-label="Next"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Question {currentIndex + 1} of {cards.length}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Upload className="h-12 w-12 mb-4" />
            <p className="text-center w-2/4 text-sm ">
              Upload a document to generate questions You can also choose how
              many questions {"you'd"} like to create using the dropdown above.
            </p>
          </div>
        )}
      </div>

      <div className="h-[15%] flex flex-col items-center justify-center gap-4">
        <label className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors shadow-md">
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
