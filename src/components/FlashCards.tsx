"use client";

import { useState } from "react";

export default function FlashCard({ question, answer }:any) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="h-64 w-full cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Question Side */}
        <div className="absolute w-full h-full bg-white rounded-xl shadow-lg p-6 backface-hidden">
          <div className="flex flex-col justify-between h-full">
            <h3 className="text-xl font-medium text-gray-800">Question</h3>
            <p className="text-gray-700">{question}</p>
            <p className="text-sm text-gray-500 italic mt-4">
              Click to reveal answer
            </p>
          </div>
        </div>

        {/* Answer Side */}
        <div className="absolute w-full h-full bg-blue-50 rounded-xl shadow-lg p-6 backface-hidden rotate-y-180">
          <div className="flex flex-col justify-between h-full">
            <h3 className="text-xl font-medium text-gray-800">Answer</h3>
            <p className="text-gray-700">{answer}</p>
            <p className="text-sm text-gray-500 italic mt-4">
              Click to see question
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
