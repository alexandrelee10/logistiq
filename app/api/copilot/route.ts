import { anthropic } from "@/app/lib/anthropic";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are Logistiq's inventory copilot. Answer question about stock, reorders, and warehouse activity concisely.",
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ message: text });
  } catch {
    // Catch all errors beyond what I can find 
    return NextResponse.json({ message: "Copilot request failed "}, { status: 500 })
  }
}
