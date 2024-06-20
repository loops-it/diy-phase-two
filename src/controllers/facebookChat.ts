import OpenAI from "openai";
import { Pinecone } from '@pinecone-database/pinecone'
import axios from 'axios';
import "dotenv/config";
import { Request as ExpressRequest } from 'express';
import {Translate} from '@google-cloud/translate/build/src/v2';
import { Request, Response } from 'express';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.PINECONE_API_KEY || typeof process.env.PINECONE_API_KEY !== 'string') {
    throw new Error('Pinecone API key is not defined or is not a string.');
}
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

interface RequestWithChatId extends ExpressRequest {
    userChatId?: string;
}
interface ChatEntry {
    role: string;
    content: string;
}

const index = pc.index("botdb");
const namespace = index.namespace('dfcc-vector-db')
let kValue = 2

const translate = new Translate({ key: process.env.GOOGLE_APPLICATION_CREDENTIALS }); 



const handleMessage = async (message_body: any) => {
  console.log("handleMessage body",message_body);
  const senderId = message_body.sender.id;
  const userQuestion = message_body.message.text;

  console.log("userQuestion", userQuestion)


  const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userQuestion,
  });

  console.log("embedding", embedding.data[0].embedding);

    const queryResponse = await namespace.query({
        vector: embedding.data[0].embedding,
        topK: kValue,
        includeMetadata: true,
    });
    console.log("queryResponse", queryResponse);

    const results: string[] = [];

    queryResponse.matches.forEach(match => {
        if (match.metadata && typeof match.metadata.Title === 'string') {
            const result = `Title: ${match.metadata.Title}, \n Content: ${match.metadata.Text} \n \n `;
            results.push(result);
        }
    });

    let context = results.join('\n');

    console.log("context", context);
  
    const gptPrompt = `You are a helpful assistant and you are friendly. Your name is DFCC GPT. 
    Answer user question Only based on given Context: ${context}, your answer must be less than 150 words. 
    If the user asks for information like your email or address, you'll provide DFCC email and address. 
    If answer has list give it as numberd list. If it has math question relevent to given Context give calculated answer, 
    If user question is not relevent to the Context just say "I'm sorry.. no information documents found for data retrieval.". 
    Do NOT make up any answers and questions not relevant to the context using public information.`;

    const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: gptPrompt },
          { role: "user", content: userQuestion }
        ],
        model: "gpt-3.5-turbo",
      });


    //let reply: string | null = completion.choices[0];

    console.log("completion", completion.choices[0]);
//    sendMessage(senderId, reply);

};

const sendMessage = async (recipientId: string, reply: any) => {

  // console.log("recipientId",recipientId)
  // console.log("reply",reply)
console.log("sendMessage",123)

  const data = {
    recipient: {
      id: recipientId,
    },
    messaging_type: "RESPONSE",
    message: {
      text: reply,
    },
  };

  try {
    const response = await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=EAAF348C6zRwBOygEAVOQDjd3QK5YhIHbGGmdDDca0HDaDEbS0sdlEqPycuP7satY9GPf6QPhYTVdUawRe7XTZBAQkaAT6rPrqNVICUNjcYxuZApRs6YjzUYpqxzUtbW1lUSyN2z4VhLhMAeMmiCzYtawEStMYtZCNIZBcOeEIB0glhiTRkT0qaXuB9I0m3Dd`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Unable to send message:', error);
  }
};

export const facebookChat = async (req: Request, res: Response) => {

    

  
    const body = req.body;

    try {
        if (body.object === 'page') {
            body.entry.forEach(async (entry: any) => {
            const message_body = entry.messaging[0];
            //console.log("messages",entry.messaging);
            await handleMessage(message_body);
            });
            res.status(200).send('EVENT_RECEIVED');
        } else {
                res.sendStatus(404);
        }
        

    } catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }

};










































