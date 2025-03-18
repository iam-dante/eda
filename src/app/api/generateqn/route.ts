import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    console.log("This is the server",text)

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // const response = await client.chat.completions.create({
    //   messages: [
    //     {
    //       role: "system",
    //       content: `Generate 5 quiz questions with answers from the following text. Format the response as a JSON array of objects with 'question' and 'answer' properties. Example: [{"question": "What is...", "answer": "The answer is..."}]`,
    //     },
    //     {
    //       role: "user",
    //       content: text,
    //     },
    //   ],
    //   model: "llama3-70b-8192",
    // });

    const prompt = `Generate 10 quiz questions with answers from the following text. 
    ${text}
    Format the response as a JSON array of objects with 'question' and 'answer' properties. Example: [{"question": "What is...", "answer": "The answer is..."}]
    
    REMEMBER RETURN ONLY THE JSON ARRAY
    `

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;

    console.log(responseContent)

    const questions = JSON.parse((responseContent?.trim() ?? "{}"));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
