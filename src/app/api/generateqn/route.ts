import { NextResponse } from "next/server";
import { OpenAI } from "openai";
// import Groq from "groq-sdk";

// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });
export const maxDuration = 60;
export async function POST(req: Request) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,}
  );
  try {
    const { text, count } = await req.json();
    console.log("This is the server", text);

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }
    const prompt = `Generate ${count} quiz questions with answers and explanations based on the following text. Focus exclusively on the concepts, tools, and rules described in the text, ignoring any mention of authors, creators, publication details, or ISSN.

    ${text}

Format the response as a JSON array of objects, each with 'question', 'answer', and 'explanation' properties. For example: [{"question": "What tools are available for...", "answer": "Tools are available for...", "explanation": "This is because..."}]

RETURN ONLY THE JSON ARRAY.`;

    const completion = await client.chat.completions.create({
      model: "gpt-40-mini",
      messages: [
        {
          role: "user",
          content:prompt,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;
    console.log(responseContent);
    const questions = JSON.parse(responseContent?.trim() ?? "{}");

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
