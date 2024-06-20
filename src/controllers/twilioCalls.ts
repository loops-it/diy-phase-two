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
            const twiml = new  VoiceResponse();
            twiml.say("Hello, This is dfcc chat bot");
            const gather = twiml.gather({
                input : "speech",
                action : "/twilio-results", 
                language : "en-US",
                speechModel : "phone_call"
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
          chatHistory.push({ role: old_chats[i].role, content:  old_chats[i].message });
        }

        const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: user_question,
        });

        console.log("user_question",user_question);

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
        const questionRephrasePrompt = `Give a friendly greeting;`;

        const final_answer = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: questionRephrasePrompt,
            max_tokens: 180,
            temperature: 0,
        });

        await prisma.voiceCalls.create({
          data: {
            call_id: call_id,
            language: "english",
            message: final_answer.choices[0].text,
            role: "bot",
            viewed_by_admin: "no",
          },
        });
        res.type('xml');
        const twiml = new  VoiceResponse();
        twiml.say(final_answer.choices[0].text);
        const gather = twiml.gather({
            input : "speech",
            action : "/twilio-results", 
            language : "en-US",
            speechModel : "phone_call"
        })
        //gather.say(" Please ask your question");
        return res.send(twiml.toString());
      } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
};
