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
    const prompt = `Generate 10 quiz questions with answers based on the following text. Focus exclusively on the concepts, tools, and rules described in the text, ignoring any mention of authors, creators, publication details, or ISSN.  
    ${text}  
Format the response as a JSON array of objects, each with 'question' and 'answer' properties. For example: [{"question": "What tools are available for...", "answer": "Tools are available for..."}]  

RETURN ONLY THE JSON ARRAY`;

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

    

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
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
