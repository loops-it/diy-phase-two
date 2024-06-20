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
        const callerNumber = req.body.From;

        const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: user_question,
        });

        console.log("user_question",user_question);

        await prisma.voiceCalls.create({
          data: {
            caller_no: callerNumber,
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
        const questionRephrasePrompt = `You are a helpful assistant and you are friendly. 
        if user greet you you will give proper greeting in friendly manner. Your name is DFCC GPT.
        Answer ${user_question} Only based on given Context: ${context}, your answer must be less than 150 words. 
        If the user asks for information like your email or address, you'll provide DFCC email and address. 
        If answer has list give it as numberd list. If it has math question relevent to given Context give calculated answer, 
        If user question is not relevent to the Context just say "I'm sorry.. no information documents found for data retrieval.". 
        Do NOT make up any answers and questions not relevant to the context using public information.`;

        const final_answer = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: questionRephrasePrompt,
            max_tokens: 180,
            temperature: 0,
        });

        await prisma.voiceCalls.create({
          data: {
            caller_no: callerNumber,
            language: "english",
            message: final_answer.choices[0].text,
            role: "bot",
            viewed_by_admin: "no",
          },
        });

        res.type('xml');
        const twiml = new  VoiceResponse();
        twiml.say(final_answer.choices[0].text);
        return res.send(twiml.toString());
      } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
};
// import express, { Request, Response, NextFunction } from 'express';
// import { twiml } from 'twilio';
// import OpenAI from 'openai';

// const { VoiceResponse } = twiml;

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export const twilioVoice = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const response = new VoiceResponse();
//     response.say('Hello, please speak after the beep. Press any key when you are done.');
//     response.record({
//         action: '/twilio-results',
//         method: 'POST',
//         finishOnKey: '*',
//         maxLength: 60
//     });
//     response.say('Recording completed. Please wait while we process your request.');

//     res.type('text/xml');
//     res.send(response.toString());
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//     }
// };
// export const twilioResults = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const recordingUrl = req.body.RecordingUrl;
//     console.log(`Recording URL: ${recordingUrl}`);

//     // Fetch the audio file from the recording URL
//     const audioResponse = await fetch(recordingUrl);
//     const audioBuffer = await audioResponse.arrayBuffer();

//     // Convert audio buffer to base64
//     const audioBase64 = Buffer.from(audioBuffer).toString('base64');

//     const file = {
//       buffer: audioBuffer, 
//       filename: 'audio.wav',
//       mimetype: 'audio/wav',
//     };
//     // Transcribe the audio to text using OpenAI Whisper
//     const transcriptionResponse = await openai.audio.transcriptions.create({
//       file: file,
//       model: 'whisper-1',
//       language: 'en',
//     });

//     const transcription = transcriptionResponse.data.text;
//     if (!transcription) {
//       throw new Error('Transcription failed or resulted in empty text');
//     }

//     console.log(`Transcription: ${transcription}`);

//     const twimlResponse = new VoiceResponse();
//     twimlResponse.say(transcription);

//     res.type('text/xml');
//     res.send(twimlResponse.toString());
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };