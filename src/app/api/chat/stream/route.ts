import { NextRequest, NextResponse } from "next/server";
import { bibleChatResponseStream } from "@/ai/flows/bible-chat-response";
import { BibleChatResponseInputSchema } from "@/lib/types";
import { TransformStream } from "stream/web";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const input = BibleChatResponseInputSchema.parse(body);

  try {
    const flowResponse = await bibleChatResponseStream(input);

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const jsonString = JSON.stringify(chunk);
        controller.enqueue(`data: ${jsonString}\n\n`);
      },
    });

    flowResponse.stream.pipeThrough(transformStream);

    return new Response(transformStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e: any) {
    console.error("Error in chat stream API:", e);
    return NextResponse.json({ error: e.message || "An unknown error occurred." }, { status: 500 });
  }
}
