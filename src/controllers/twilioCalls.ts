import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import "dotenv/config";
import { Pinecone } from '@pinecone-database/pinecone'
import { PrismaClient } from "@prisma/client";
import twilio from 'twilio';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


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

// //TWILIO BOT RESPONSE
// export const twilioVoice = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     res.type('xml');
//     const twiml = new VoiceResponse();
//     twiml.say("Hello, This is dfcc chat bot");
//     const gather = twiml.gather({
//       input: "speech",
//       action: "/twilio-results",
//       language: "en-IN", 
//       speechModel: "phone_call"  
//     })
//     gather.say(" Please ask your question");
//     return res.send(twiml.toString());
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };

// export const twilioResults = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     //console.log(req.body);
//     const user_question = req.body.SpeechResult;
//     const call_id = req.body.CallSid;
//     let chatHistory = req.body.messages || [];

//     const old_chats = await prisma.voiceCalls.findMany({
//       where: {
//         call_id: call_id
//       },
//       orderBy: { created_at: 'desc' },
//     });

    
//     for (var i = 0; i < old_chats.length; i++) {
//       chatHistory.push({ role: old_chats[i].role, content: old_chats[i].message });
//     }

//     chatHistory.push({ role: "user", content: user_question });

//     console.log(chatHistory);
    
//     const questionRephrasePrompt = `As a senior banking assistant, kindly assess whether the FOLLOWUP QUESTION related to the CHAT HISTORY or if it introduces a new question. If the FOLLOWUP QUESTION is unrelated, refrain from rephrasing it. However, if it is related, please rephrase it as an independent query utilizing relevent keywords from the CHAT HISTORY, even if it is a question related to the calculation. If the user asks for information like email or address, provide DFCC email and address.
// ----------
// CHAT HISTORY: {${chatHistory}}
// ----------
// FOLLOWUP QUESTION: {${user_question}}
// ----------
// Standalone question:`;

//     const completionQuestion = await openai.completions.create({
//       model: "gpt-3.5-turbo-instruct",
//       prompt: questionRephrasePrompt,
//       max_tokens: 50,
//       temperature: 0,
//     });

//     console.log("standalone question : ", completionQuestion)

//     const embedding = await openai.embeddings.create({
//       model: "text-embedding-ada-002",
//       input: completionQuestion.choices[0].text,
//     });

//     console.log("user_question", user_question);

//     await prisma.voiceCalls.create({
//       data: {
//         call_id: call_id,
//         language: "english",
//         message: user_question,
//         role: "user",
//         viewed_by_admin: "no",
//       },
//     });
//     //console.log("embedding",embedding.data[0].embedding);

//     const queryResponse = await namespace.query({
//       vector: embedding.data[0].embedding,
//       topK: 2,
//       includeMetadata: true,
//     });

//     const results: string[] = [];
//     queryResponse.matches.forEach((match) => {
//       if (match.metadata && typeof match.metadata.Title === "string") {
//         const result = `Title: ${match.metadata.Title}, \n Content: ${match.metadata.Text} \n \n `;
//         results.push(result);
//       }
//     });
//     let context = results.join("\n");

//     if (chatHistory.length === 0 || chatHistory[0].role !== "system") {
//       chatHistory.unshift({ role: "system", content: "" });
//     }
//     chatHistory[0].content = `You are a helpful assistant and you are friendly. if user greet you you will give proper greeting in friendly manner. Your name is DFCC GPT. Answer user question Only based on given Context: ${context}, your answer must be less than 150 words. If the user asks for information like your email or address, you'll provide DFCC email and address. If answer has list give it as numberd list. If it has math question relevent to given Context give calculated answer, If user question is not relevent to the Context just say "I'm sorry.. no information documents found for data retrieval.". Do NOT make up any answers and questions not relevant to the context using public information.`;

//     // console.log("context", context);
//     // const questionRephrasePrompt = `Give a friendly greeting;`;

//     // const final_answer = await openai.completions.create({
//     //     model: "gpt-3.5-turbo-instruct",
//     //     prompt: questionRephrasePrompt,
//     //     max_tokens: 180,
//     //     temperature: 0,
//     // });



//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: chatHistory,
//       max_tokens: 180,
//       temperature: 0,
//     });

//     let botResponse: string | null = completion.choices[0].message.content;
//     console.log("botResponse : ", botResponse);

//     await prisma.voiceCalls.create({
//       data: {
//         call_id: call_id,
//         language: "english",
//         message: botResponse,
//         role: "assistant",
//         viewed_by_admin: "no",
//       },
//     });
//     res.type('xml');
//     const twiml = new VoiceResponse();
//     twiml.say(botResponse);
//     const gather = twiml.gather({
//       input: "speech",
//       action: "/twilio-results",
//       language: "en-IN",
//       speechModel: "phone_call"
//     })
//     gather.say("Do you have any other questions");
//     return res.send(twiml.toString());
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };



//TWILIO CALL FUNCTION
export const twilioCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const numbers = [
      '+94722794528',
    ];
    numbers.forEach((number) => {
      client.calls.create({
        url: 'https://diy-phase-two.vercel.app/twilio-survey',
        to: number,
        from: '+17692532128',
        
      }).then((call) => console.log(call.sid));
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const callStates: { [key: string]: number } = {};
const questions = [
  'How Are You',
  'How Are You',
  'How Are You'
];
export const twilioSurvey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callSid = req.body.CallSid;
    const currentQuestionIndex = callStates[callSid] || 0;
  
    if (currentQuestionIndex < questions.length) {
      const twiml = new VoiceResponse();
      const gather = twiml.gather({
        input: "speech",
        action: `/twilio-survey-response?callSid=${callSid}`,
        language: "si-LK",
        speechModel: "phone_call"
      })
      gather.say(questions[currentQuestionIndex]);
      callStates[callSid] = currentQuestionIndex + 1;
      res.type('text/xml');
      return res.send(twiml.toString());
    } else {
      const twiml = new VoiceResponse();
      twiml.say('Thank you for your responses. Goodbye!');
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const twilioSurveyResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callSid = req.query.callSid as string;
    const transcription = req.body.TranscriptionText;
    const currentQuestionIndex = callStates[callSid] || 0;
    console.log(`Call SID: ${callSid}, Question: ${questions[currentQuestionIndex - 1]}, Answer: ${transcription}`);
    if (currentQuestionIndex < questions.length) {
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.redirect('/twilio-survey');
      res.type('text/xml');
      res.send(twiml.toString());
    } else {
      delete callStates[callSid];
      res.sendStatus(200);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};


// TWILIO FEEDBACK WITH LANGUAGE
export const twilioVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.type('xml');
    const twiml = new VoiceResponse();
    //twiml.say("Hello, This is dfcc chat bot");
    const gather = twiml.gather({
      input: "dtmf",
      action: "/twilio-results",
    })
    gather.play('https://genaitech.dev/kodetech-welcome-message.mp3');
    return res.send(twiml.toString());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
export const twilioResults = async (req: Request, res: Response, next: NextFunction) => {
  const userInput = req.body.Digits;
  console.log(userInput);
  const twiml = new VoiceResponse();
  if(userInput == "1"){
    twiml.play('https://genaitech.dev/english-message.mp3');
    twiml.record({
      action: '/twilio-feedback',
      method: 'POST',
      maxLength: 60
    });
    res.type('text/xml');
    return res.send(twiml.toString());
  }
  else if(userInput == "2"){
    twiml.play('https://genaitech.dev/sinhala-message.mp3');
    twiml.record({
      action: '/twilio-feedback',
      method: 'POST',
      maxLength: 60
    });
    res.type('text/xml');
    return res.send(twiml.toString());
  }
  else if(userInput == "3"){
    twiml.play('https://genaitech.dev/tamil-message.mp3');
    twiml.record({
      action: '/twilio-feedback',
      method: 'POST',
      maxLength: 60
    });
    res.type('text/xml');
    return res.send(twiml.toString());
  }
  else{
    res.type('xml');
    const gather = twiml.gather({
      input: "dtmf",
      action: "/twilio-results", 
    })
    gather.play('https://genaitech.dev/incorrect.mp3');
    return res.send(twiml.toString());
  }
};

export const twilioFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recordingSid = req.body.RecordingSid as string;
    const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
    const authToken = process.env.TWILIO_AUTH_TOKEN as string;
    let status = "processing";
    const recording_status = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.json`;

    while (status == "completed") {
      const response = await fetch(recording_status, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        }
      });
      console.log(response);
      status = "completed"
      if (!response.ok) {
        throw new Error(`Failed to fetch recording: ${response.statusText}`);
      }
    }

    // const recordingUrl = https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3;
    

    

    const audioBuffer = await response.buffer();

    const convertedAudioBuffer = await convertAudio(audioBuffer);

    const filename = 'recording.mp3';
    const file = new File([convertedAudioBuffer], filename, { type: 'audio/mp3' });

    const transcriptionResponse = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });

    if (!transcriptionResponse.text) {
      throw new Error('Transcription failed or resulted in empty text');
    }

    const transcription = transcriptionResponse.text;
    console.log(`Transcription: ${transcription}`);

    const twimlResponse = new twiml.VoiceResponse();
    twimlResponse.say(transcription);

    res.type('text/xml');
    res.send(twimlResponse.toString());
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};