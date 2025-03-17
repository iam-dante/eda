import { NextResponse } from "next/server";
// ...existing imports...

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file selected" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const [response, status] = await saveToChromaDB({
      buffer: Buffer.from(buffer),
      originalname: file.name,
    });

    return NextResponse.json(response, { status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Remove the config export as it's not needed in App Router
