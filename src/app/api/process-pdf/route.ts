import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { defaultModel } from "@/lib/config";
import { getModelProvider, isModelSupported } from "@/lib/aiProviders";
import { ModelId } from "@/lib/models";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      url,
      sessionId,
      filename,
      question,
      model = defaultModel,
    } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const modelId = isModelSupported(model) ? model : defaultModel;
    const aiModel = await getModelProvider(modelId as ModelId);

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch PDF" },
        { status: 404 }
      );
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let docs: Array<{ pageContent: string; metadata: Record<string, any> }>;
    try {
      const blob = new Blob([buffer], { type: "application/pdf" });
      const { WebPDFLoader } = await import(
        "@langchain/community/document_loaders/web/pdf"
      );
      docs = await new WebPDFLoader(blob).load();
    } catch (langchainError) {
      console.warn(
        "LangChain PDF loader failed, falling back to pdf-parse:",
        langchainError
      );

      const { default: pdfParse } = await import("pdf-parse");
      const pdfData = await pdfParse(buffer);
      docs = [
        {
          pageContent: pdfData.text,
          metadata: {
            source: filename,
            pages: pdfData.numpages,
            info: pdfData.info,
          },
        },
      ];
    }

    if (!docs.length) {
      return NextResponse.json(
        { error: "No content extracted from PDF" },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json({ docs });
    }

    const pdfContent = docs.map((d) => d.pageContent).join("\n\n");
    const systemPrompt = `You are a helpful assistant that answers questions about PDF documents.

      The user has uploaded a PDF file and is asking questions about its content. 
      Please answer based on the PDF below.

      PDF Content:
        ${pdfContent}

      Instructions:
        - Answer only from the PDF
        - If not in the PDF, say so
        - Be concise yet thorough
        - Cite parts when relevant
        - If unreadable or empty, inform the user
    `;

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
