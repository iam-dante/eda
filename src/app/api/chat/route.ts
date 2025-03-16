import { streamText } from "ai";
import { createOllama } from "ollama-ai-provider";

// Initialize Ollama client with correct property names
const ollamaClient = createOllama({
  baseUrl: "http://localhost:11434/api/generate",
  headers: { "Content-Type": "application/json" },
});

// Initialize model handler (assumes createOllama returns a function)
const model = ollamaClient("llama3.2");

// Allow streaming responses up to 30 seconds
export const maxDuration = 100;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const result = streamText({
      model,
      messages,
    });
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500 }
    );
  }
}
