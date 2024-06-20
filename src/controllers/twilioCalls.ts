import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import { Pinecone } from '@pinecone-database/pinecone'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const VoiceResponse = require('twilio').twiml.VoiceResponse;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (
  !process.env.PINECONE_API_KEY ||
  typeof process.env.PINECONE_API_KEY !== "string"
) {
  throw new Error("Pinecone API key is not defined or is not a string.");
}
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("botdb");
const namespace = index.namespace("dfcc-vector-db");

export const twilioVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.type('xml');
    const twiml = new VoiceResponse();
    twiml.say("Hello, This is dfcc chat bot");
    const gather = twiml.gather({
      input: "speech",
      action: "/twilio-results",
      language: "en-US",
      speechModel: "phone_call"
    })
    gather.say(" Please ask your question");
    return res.send(twiml.toString());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const twilioResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //console.log(req.body);
    const user_question = req.body.SpeechResult;
    const call_id = req.body.CallSid;
    let chatHistory = req.body.messages || [];

    const old_chats = await prisma.voiceCalls.findMany({
      where: {
        call_id: call_id
      },
      orderBy: { created_at: 'desc' },
    });

    for (var i = 0; i < old_chats.length; i++) {
      chatHistory.push({ role: old_chats[i].role, content: old_chats[i].message });
    }

    const questionRephrasePrompt = `As a senior banking assistant, kindly assess whether the FOLLOWUP QUESTION related to the CHAT HISTORY or if it introduces a new question. If the FOLLOWUP QUESTION is unrelated, refrain from rephrasing it. However, if it is related, please rephrase it as an independent query utilizing relevent keywords from the CHAT HISTORY, even if it is a question related to the calculation. If the user asks for information like email or address, provide DFCC email and address.
----------
CHAT HISTORY: {${chatHistory}}
----------
FOLLOWUP QUESTION: {${user_question}}
----------
Standalone question:`;

    const completionQuestion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: questionRephrasePrompt,
      max_tokens: 50,
      temperature: 0,
    });

    console.log("standalone question : ", completionQuestion)

    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: completionQuestion.choices[0].text,
    });

    console.log("user_question", user_question);

    await prisma.voiceCalls.create({
      data: {
        call_id: call_id,
        language: "english",
        message: user_question,
        role: "customer",
        viewed_by_admin: "no",
      },
    });
    //console.log("embedding",embedding.data[0].embedding);

    const queryResponse = await namespace.query({
      vector: embedding.data[0].embedding,
      topK: 2,
      includeMetadata: true,
    });

    const results: string[] = [];
    queryResponse.matches.forEach((match) => {
      if (match.metadata && typeof match.metadata.Title === "string") {
        const result = `Title: ${match.metadata.Title}, \n Content: ${match.metadata.Text} \n \n `;
        results.push(result);
      }
    });
    let context = results.join("\n");

    console.log("context", context);
    // const questionRephrasePrompt = `Give a friendly greeting;`;

    // const final_answer = await openai.completions.create({
    //     model: "gpt-3.5-turbo-instruct",
    //     prompt: questionRephrasePrompt,
    //     max_tokens: 180,
    //     temperature: 0,
    // });



    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatHistory,
      max_tokens: 180,
      temperature: 0,
    });

    let botResponse: string | null = completion.choices[0].message.content;
    console.log("botResponse : ", botResponse);

    await prisma.voiceCalls.create({
      data: {
        call_id: call_id,
        language: "english",
        message: botResponse,
        role: "bot",
        viewed_by_admin: "no",
      },
    });
    res.type('xml');
    const twiml = new VoiceResponse();
    twiml.say(botResponse);
    const gather = twiml.gather({
      input: "speech",
      action: "/twilio-results",
      language: "en-US",
      speechModel: "phone_call"
    })
    gather.say("Do you have any other questions");
    return res.send(twiml.toString());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
