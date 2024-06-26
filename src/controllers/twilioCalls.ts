import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import "dotenv/config";
import { Pinecone } from '@pinecone-database/pinecone'
import { PrismaClient } from "@prisma/client";
import twilio from 'twilio';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
import fetch from 'node-fetch';
import { PassThrough } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
const speech = require('@google-cloud/speech');

ffmpeg.setFfmpegPath(ffmpegPath.path);

const prisma = new PrismaClient();

const serviceAccountKey = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
};

const clientGoogle = new speech.SpeechClient({ credentials: serviceAccountKey });

// const clientGoogle = new speech.SpeechClient({ keyFilename: process.env.DIY });


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
// export const twilioCall = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const numbers = [
//       '+94722794528',
//     ];
//     // const numbers = [
//     //   '+94711808676',
//     //   '+94772275263'
//     // ];.
//     // const numbers = [
//     //   '+94760590887'
//     // ];
//     numbers.forEach((number) => {
//       client.calls.create({
//         url: 'https://diy-phase-two.vercel.app/twilio-voice',
//         to: number,
//         from: '+17692532128',

//       }).then((call) => console.log(call.sid));
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };
export const twilioCall = async (req: Request, res: Response, next: NextFunction) => {

  const callNumber = req.body.phoneNumber;

    try {
      // const numbers = [
      //   '+94722794528',
      // ];
      // const numbers = [
      //   '+94711808676',
      //   '+94772275263'
      // ];.
      // const numbers = [
      //   '+94707775263',
      // ];
      const numbers = [callNumber];
      console.log('calling ...', numbers)
      const callPromises = numbers.map((number) => {
        return client.calls.create({
          url: 'https://diy-phase-two.vercel.app/twilio-voice',
          to: number,
          from: '+17692532128',
        });
      });
  
      const callResults = await Promise.all(callPromises);
      callResults.forEach(call => console.log(call.sid));
      res.status(200).json({ status: 'success', message: 'Calls initiated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  };
export const twilioSurvey = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
export const twilioSurveyResponse = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
// const callStates: { [key: string]: number } = {};
// const questions = [
//   'How Are You',
//   'How Are You',
//   'How Are You'
// ];
// export const twilioSurvey = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const callSid = req.body.CallSid;
//     const currentQuestionIndex = callStates[callSid] || 0;

//     if (currentQuestionIndex < questions.length) {
//       const twiml = new VoiceResponse();
//       const gather = twiml.gather({
//         input: "speech",
//         action: `/twilio-survey-response?callSid=${callSid}`,
//         language: "si-LK",
//         speechModel: "phone_call"
//       })
//       gather.say(questions[currentQuestionIndex]);
//       callStates[callSid] = currentQuestionIndex + 1;
//       res.type('text/xml');
//       return res.send(twiml.toString());
//     } else {
//       const twiml = new VoiceResponse();
//       twiml.say('Thank you for your responses. Goodbye!');
//       twiml.hangup();
//       res.type('text/xml');
//       return res.send(twiml.toString());
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };

// export const twilioSurveyResponse = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const callSid = req.query.callSid as string;
//     const transcription = req.body.TranscriptionText;
//     const currentQuestionIndex = callStates[callSid] || 0;
//     console.log(`Call SID: ${callSid}, Question: ${questions[currentQuestionIndex - 1]}, Answer: ${transcription}`);
//     if (currentQuestionIndex < questions.length) {
//       const twiml = new twilio.twiml.VoiceResponse();
//       twiml.redirect('/twilio-survey');
//       res.type('text/xml');
//       res.send(twiml.toString());
//     } else {
//       delete callStates[callSid];
//       res.sendStatus(200);
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };


// TWILIO FEEDBACK WITH LANGUAGE
// export const twilioVoice = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     res.type('xml');
//     const twiml = new VoiceResponse();
//     //twiml.say("Hello, This is dfcc chat bot");
//     const gather = twiml.gather({
//       input: "dtmf",
//       action: "/twilio-results",
//       timeout: 5,
//       speechTimeout : 5
//     })
//     gather.play('https://genaitech.dev/kodetech-welcome-message.mp3');
//     return res.send(twiml.toString());
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// };

// timeout: 5,
// speechTimeout : 5

export const twilioVoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.type('xml');
      const twiml = new VoiceResponse();
      // twiml.say("Hi, This is Kodetech private limited.");
      const gather = twiml.gather({
        input: "dtmf",
        action: "/twilio-results",
      });
      gather.play('https://diy-phase-two.vercel.app/audio/welcome-message.mp3');
      // gather.say("press 1 for English. \n press 2 for Sinhala. \n press 3 for Tamil.");
      twiml.say('We didn\'t receive any input. Goodbye!');
      res.send(twiml.toString());
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
// export const twilioResults = async (req: Request, res: Response, next: NextFunction) => {
//   const userInput = req.body.Digits;
//   console.log(userInput);
//   const twiml = new VoiceResponse();
//   if (userInput == "1") {
//     twiml.play('https://genaitech.dev/english-message.mp3');
//     twiml.record({
//       action: '/twilio-feedback?lan=en',
//       method: 'POST',
//       maxLength: 60
//     });
//     res.type('text/xml');
//     return res.send(twiml.toString());
//   }
//   else if (userInput == "2") {
//     twiml.play('https://genaitech.dev/sinhala-message.mp3');
//     twiml.record({
//       action: '/twilio-feedback?lan=si',
//       method: 'POST',
//       maxLength: 60
//     });
//     res.type('text/xml');
//     return res.send(twiml.toString());
//   }
//   else if (userInput == "3") {
//     twiml.play('https://genaitech.dev/tamil-message.mp3');
//     twiml.record({
//       action: '/twilio-feedback?lan=ta',
//       method: 'POST',
//       maxLength: 60
//     });
//     res.type('text/xml');
//     return res.send(twiml.toString());
//   }
//   else {
//     res.type('xml');
//     const gather = twiml.gather({
//       input: "dtmf",
//       action: "/twilio-results",
//     })
//     gather.play('https://genaitech.dev/incorrect.mp3');
//     return res.send(twiml.toString());
//   }
// };
export const twilioResults = async (req: Request, res: Response, next: NextFunction) => {
    const userInput = req.body.Digits;
    console.log("User Pressed No : ", userInput);
    const twiml = new VoiceResponse();
  
    try {
      if (userInput === "1") {
        // twiml.play('https://genaitech.dev/english-message.mp3');
        twiml.say("Please give us your feedback after the beep.");
      } else if (userInput === "2") {
        twiml.play('https://diy-phase-two.vercel.app/audio/sinhalaMessage.mp3');
        // twiml.say("Please leave your message after the beep sound.");
      } else if (userInput === "3") {
        twiml.play('https://diy-phase-two.vercel.app/audio/tamilMessage.mp3');
        // twiml.say("Please leave your message after the beep sound.");
      } else {
        const gather = twiml.gather({
          input: "dtmf",
          action: "/twilio-results",
        });
        gather.play('https://diy-phase-two.vercel.app/incorrectMessage.mp3');
        // gather.say('Incorrect input');
      }
  
      if (["1", "2", "3"].includes(userInput)) {
        twiml.record({
          action: `/twilio-feedback?lan=${userInput === "1" ? "en" : userInput === "2" ? "si" : "ta"}`,
          method: 'POST',
          maxLength: 60,
          timeout: 3,
        });
      }
  
      res.type('xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  };
export const twilioFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const language = req.query.lan as string;
    const recordingSid = req.body.RecordingSid as string;
    const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
    const authToken = process.env.TWILIO_AUTH_TOKEN as string;

    const recording_status = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.json`;
    let responseData;
    do {
      try {
        const response = await fetch(recording_status, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        responseData = await response.json();

        console.log('Current status:', responseData.status);

        if (responseData.status !== 'completed') {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error('Error fetching recording status:', error);
        return;
      }
    } while (responseData.status !== 'completed');

    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;

    const audioResponse = await fetch(recordingUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch recording: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.buffer();

    const convertedAudioBuffer = await convertAudio(audioBuffer);

    const filename = 'recording.mp3';
    const file = new File([convertedAudioBuffer], filename, { type: 'audio/mp3' });

    let transcription = "";

    async function GoogleCloudSpeech(languageToSpeechClient: string, audioBuffer: Buffer): Promise<string> {
      console.log("google speech running...")
      const audioBytes = audioBuffer.toString('base64');
      const audio = { content: audioBytes };
      const config = {
        encoding: 'MP3',
        sampleRateHertz: 16000,
        languageCode: languageToSpeechClient,
      };
      const request = { audio: audio, config: config };

      try {
        console.log("transcribing ......")
        const [response] = await clientGoogle.recognize(request);
        const transcriptionFile = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
        console.log(`Transcription (Google Cloud): ${transcriptionFile}`);
        console.log("transcribing ended ...")
        return transcriptionFile;
      } catch (error) {
        console.error('ERROR:', error);
        return "";
      }
    }

    // async function whisperModel(file: File): Promise<string> {
    //   try {
    //     console.log("wisper running...")
    //     const transcriptionResponse = await openai.audio.transcriptions.create({
    //       file,
    //       model: 'whisper-1',
    //       language: 'en',
    //     });

    //     if (!transcriptionResponse.text) {
    //       throw new Error('Transcription failed or resulted in empty text');
    //     }

    //     console.log(`Transcription (Whisper Model): ${transcriptionResponse.text}`);
    //     return transcriptionResponse.text;
    //   } catch (error) {
    //     console.error('ERROR:', error);
    //     return "";
    //   }
    // }

    if (language === 'si' || language === 'ta' || language === 'en') {
      const languageToSpeechClient = language === 'si' ? 'si-LK' : (language === 'ta' ? 'ta-LK' : 'en-IN');
      console.log("Language: ", languageToSpeechClient);
      transcription = await GoogleCloudSpeech(languageToSpeechClient, audioBuffer);
    } 
    // else {
    //   transcription = await whisperModel(file);
    // }

    if (!transcription) {
      throw new Error('Transcription failed or resulted in empty text');
    }

    console.log(`Transcription Final: ${transcription}`);

    //whisper
    // const transcriptionResponse = await openai.audio.transcriptions.create({
    //   file,
    //   model: 'whisper-1',
    //   language: 'en',
    // });

    // if (!transcriptionResponse.text) {
    //   throw new Error('Transcription failed or resulted in empty text');
    // }

    // const transcription = transcriptionResponse.text;
    


    const twiml = new VoiceResponse();
    console.log("user message", transcription);
    // twiml.say("You feedback was."+transcription+". Thank you for your feedback");
    // twiml.say("Thank you for your feedback");

    if (language === "en") {
      // twiml.play('https://genaitech.dev/english-message.mp3');
      twiml.say("Thank you for your feedback.");
      // twiml.play('https://diy-phase-two.vercel.app/audio/thankyouEnglish.mp3');
    } else if (language === "si") {
      twiml.play('https://diy-phase-two.vercel.app/audio/thankyouSinhala.mp3');
      // twiml.say("Please leave your message after the beep sound.");
    } else if (language === "ta") {
      twiml.play('https://diy-phase-two.vercel.app/audio/thankyouTamil.mp3');
      // twiml.say("Please leave your message after the beep sound.");
    } 

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

async function convertAudio(audioBuffer: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    const data: Buffer[] = [];

    outputStream.on('data', chunk => data.push(chunk));
    outputStream.on('end', () => resolve(Buffer.concat(data)));
    outputStream.on('error', error => {
      console.error('Output stream error:', error);
      reject(error);
    });

    inputStream.end(audioBuffer);

    ffmpeg(inputStream)
      .on('error', (error) => {
        console.error('ffmpeg error:', error);
        reject(error);
      })
      .toFormat('mp3')
      .pipe(outputStream);
  });
}