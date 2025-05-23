"use client";

import { useState } from "react";
import { useSpring, animated } from "react-spring";

export default function FlashCard({ question, answer, questionNo, explanation}:any) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Create the animation for the card
  const { transform, opacity } = useSpring({
    opacity: isFlipped ? 1 : 0,
    transform: `perspective(600px) rotateY(${isFlipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="h-72 w-full cursor-pointer" onClick={handleFlip}>
      <div className="relative w-full h-full">
        {/* Question Side (front) */}
        <animated.div
          className="absolute w-full h-full bg-white rounded-xl shadow-lg p-6 font-sans"
          style={{
            opacity: opacity.to((o) => 1 - o),
            transform,
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex flex-col justify-between h-full">
            <h3 className="text-2xl font-medium text-orange-600 font-barriecito">
              Question {questionNo + 1}
            </h3>
            <p className="text-gray-700 text-xl">{question}</p>
            <p className="text-xs text-gray-500 italic mt-4">
              Click to reveal answer
            </p>
          </div>
        </animated.div>

        {/* Answer Side (back) */}
        <animated.div
          className="absolute w-full h-full bg-orange-50 rounded-xl shadow-lg p-6 border-2 border-orange-800 font-sans"
          style={{
            opacity,
            transform: transform.to((t) => `${t} rotateY(180deg)`),
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex flex-col justify-between h-full">
            <h3 className="text-2xl font-medium text-black font-jet">Answer</h3>
            <p className="text-gray-700 text-xl">{answer}</p>
            <h3 className="text-2xl font-medium text-black font-jet">Explanation</h3>
            <p className="text-gray-700 text-xl">{explanation}</p>
            <p className="text-xs text-gray-500 italic mt-4">
              Click to see question
            </p>
          </div>
        </animated.div>
      </div>
    </div>
  );
}
