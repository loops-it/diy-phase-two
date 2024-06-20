import OpenAI from "openai";
import { Pinecone } from '@pinecone-database/pinecone'
import "dotenv/config";
import { Request as ExpressRequest, Response } from 'express';
import File from '../../models/File';
import FacebookChats from '../../models/FacebookChats';
import {Translate} from '@google-cloud/translate/build/src/v2';
import axios from 'axios';
import Node from "../../models/Node";
import FlowTextOnly from "../../models/FlowTextOnly";
import FlowTextBox from "../../models/FlowTextBox";
import FlowCardData from "../../models/FlowCardData";
import FlowButtonData from "../../models/FlowButtonData";
import Edge from "../../models/Edge";

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

const translate = new Translate({ key: process.env.GOOGLE_APPLICATION_CREDENTIALS }); 

export const chatControllerFacebook = async (req: RequestWithChatId, res: Response) => {
    const intentsList = await Node.findAll({
        attributes: ["intent"],
        group: ["intent"],
    });
    let cachedIntentsList: string[] = [];
    cachedIntentsList = intentsList
        .filter((intent) => intent.intent !== null)
        .map((intent) => intent.intent);
        
    const body = req.body;
    //let message_body; 
    let message_body: { message?: { text: any }; postback?: { payload: any }; sender: { id: any } } = { sender: { id: '' } };
    
    let chatHistory = req.body.messages || [];
    
    if (body.object === 'page') {
        body.entry.forEach(async (entry: any) => {
        message_body = entry.messaging[0];
        if (message_body.postback) {
            console.log("Postback Data:", message_body.postback);
        } else {
            console.log("Message Data:", message_body.message);
        }
        });
        
    } else {
            res.sendStatus(404);
    }

    const old_chats = await FacebookChats.findAll({
        where: {
          sender_id: message_body.sender.id
        },
        limit: 10,
        order: [['createdAt', 'DESC']]
    });
    for (var i = 0; i < old_chats.length; i++) {
        chatHistory.push({ role: old_chats[i].message_sent_by, content:  old_chats[i].message });
    }
    if (message_body.message && message_body.message.text) {
        chatHistory.push({ role: 'user', content: message_body.message.text });
    } else if (message_body.postback && message_body.postback.payload) {
        chatHistory.push({ role: 'user', content: message_body.postback.payload });
    }
    // console.log("req : ", req.body.chatId) 
    const index = pc.index("dfccchatbot");
    const namespace = index.namespace('pinecone-gpt-test');
 
    let language = "English";


    try {


        //============= get question ======================
        // get user message with history
       
        // Get the user question from the chat history
        let userQuestion = "";
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            if (chatHistory[i].role === "user") {
                userQuestion = chatHistory[i].content;
                break;
            }
        }
        
        let translatedQuestion = "";
        if (language == 'Sinhala') {
            translatedQuestion = await translateToEnglish(userQuestion);
        }
        else if (language === 'Tamil') {
            translatedQuestion = await translateToEnglish(userQuestion);
        }
        else {
            translatedQuestion = userQuestion;
        }

        
        async function translateToEnglish(userQuestion: string) {
            const [translationsToEng] = await translate.translate(userQuestion, 'en');
            const finalQuestion = Array.isArray(translationsToEng) ? translationsToEng.join(', ') : translationsToEng;
            return finalQuestion;
        }

        const productOrServiceQuestion = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: `If the given question : "${translatedQuestion}" is related to a service or product, check if it is mentioned in the intent list :  ${cachedIntentsList}, if it is in the intent list state Only matching intent name from the list. Do not add any other words. If it is not just say this word "not a product".`,
            max_tokens: 20,
            temperature: 0,
        });

        const stateProduct = productOrServiceQuestion.choices[0].text;
        console.log("stateProduct :",stateProduct);

        if (stateProduct && stateProduct.toLowerCase().includes("not a product")) {
            const lastUserIndex = chatHistory.map((entry: ChatEntry) => entry.role).lastIndexOf('user');
            if (lastUserIndex !== -1) {
                chatHistory[lastUserIndex].content = translatedQuestion;
            }
            await FacebookChats.create(
                { 
                sender_id: message_body.sender.id,
                message_sent_by: 'user',
                message: translatedQuestion,
                },
            );
    
            let kValue = 2
    
            //============= change context ======================
            async function handleSearchRequest(translatedQuestion: string, kValue: number) {
    
            
    
                // ================================================================
                // STANDALONE QUESTION GENERATE
                // ================================================================
                const filteredChatHistory = chatHistory.filter((item: { role: string; }) => item.role !== 'system');
    
                const chatHistoryString = JSON.stringify(filteredChatHistory);
    
                //console.log("chatHistoryString", chatHistoryString);
             
    
                const questionRephrasePrompt = `As a senior banking assistant, kindly assess whether the FOLLOWUP QUESTION related to the CHAT HISTORY or if it introduces a new question. If the FOLLOWUP QUESTION is unrelated, refrain from rephrasing it. However, if it is related, please rephrase it as an independent query utilizing relevant keywords from the CHAT HISTORY, even if it is a question related to the calculation. If the user asks for information like email or address, provide DFCC email and address.
                ----------
                CHAT HISTORY: {${chatHistoryString}}
                ----------
                FOLLOWUP QUESTION: {${translatedQuestion}}
                ----------
                Standalone question:`
    
                
    
    
    
                const completionQuestion = await openai.completions.create({
                    model: "gpt-3.5-turbo-instruct",
                    prompt: questionRephrasePrompt,
                    max_tokens: 50,
                    temperature: 0,
                });
    
                console.log("Standalone Question :", completionQuestion.choices[0].text)
    
    
                // =============================================================================
                // create embeddings
                const embedding = await openai.embeddings.create({
                    model: "text-embedding-ada-002",
                    input: completionQuestion.choices[0].text,
                });
                // console.log(embedding.data[0].embedding);
    
    
    
    
                // =============================================================================
                // query from pinecone
                // console.log('K - ', kValue)
                const queryResponse = await namespace.query({
                    vector: embedding.data[0].embedding,
                    topK: kValue,
                    includeMetadata: true,
                });
                // console.log("VECTOR RESPONSE : ",queryResponse.matches)
    
    
    
    
                // =============================================================================
                // get vector documents into one string
                const results: string[] = [];
                // console.log("CONTEXT : ", queryResponse.matches[0].metadata);
                queryResponse.matches.forEach(match => {
                    if (match.metadata && typeof match.metadata.Title === 'string') {
                        const result = `Title: ${match.metadata.Title}, \n Content: ${match.metadata.Text} \n \n `;
                        results.push(result);
                    }
                });
                let context = results.join('\n');
    
                //console.log("CONTEXT DATA : ",context)
    
                // set system prompt
                // =============================================================================
                if (chatHistory.length === 0 || chatHistory[0].role !== 'system') {
                    chatHistory.unshift({ role: 'system', content: '' });
                }
                chatHistory[0].content = `You are a helpful assistant and you are friendly. Your name is DFCC GPT. Answer user question Only based on given Context: ${context}, your answer must be less than 150 words. If the user asks for information like your email or address, you'll provide DFCC email and address. If answer has list give it as numberd list. If it has math question relevent to given Context give calculated answer, If user question is not relevent to the Context just say "I'm sorry.. no information documents found for data retrieval.". Do NOT make up any answers and questions not relevant to the context using public information.`;
            }
    
    
    
            // async function processRequest(translatedQuestion: string, userChatId: string) {
            await handleSearchRequest(translatedQuestion, kValue);
    
            // GPT response ===========================
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: chatHistory,
                max_tokens: 180,
                temperature: 0
            });
    
            let botResponse: string | null = completion.choices[0].message.content
            let selectedLanguage = 'en';
            let translatedResponse = "";
            // console.log("userQuestion : ", userQuestion)
            if (language == 'Sinhala') {
                selectedLanguage = 'si';
                if (botResponse !== null) {
                    translatedResponse = await translateToLanguage(botResponse);
                }
            }
            else if (language === 'Tamil') {
                selectedLanguage = 'ta';
                if (botResponse !== null) {
                    translatedResponse = await translateToLanguage(botResponse);
                }
            }
            else {
                selectedLanguage = 'en';
                if (botResponse !== null) {
                    translatedResponse = botResponse;
                }
            }
    
            async function translateToLanguage(botResponse: string) {
                const [translationsToLanguage] = await translate.translate(botResponse, selectedLanguage);
                const finalAnswer = Array.isArray(translationsToLanguage) ? translationsToLanguage.join(', ') : translationsToLanguage;
                return finalAnswer;
            }
      
    
                // add assistant to array
                //chatHistory.push({ role: 'assistant', content: botResponse });
    
                // }
    
                await FacebookChats.create(
                    { 
                    sender_id: message_body.sender.id,
                    message_sent_by: 'assistant',
                    message: botResponse,
                    },
                );
    
                //console.log("botResponse",botResponse);
                // console.log("translatedResponse",translatedResponse);
                
                ///////// Normal Message ////////
                const data = {
                    recipient: {
                      id: message_body.sender.id
                    },
                    messaging_type: "RESPONSE",
                    message: {
                      text: botResponse,
                    },
                  };
    
                const response = await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=EAAF348C6zRwBOygEAVOQDjd3QK5YhIHbGGmdDDca0HDaDEbS0sdlEqPycuP7satY9GPf6QPhYTVdUawRe7XTZBAQkaAT6rPrqNVICUNjcYxuZApRs6YjzUYpqxzUtbW1lUSyN2z4VhLhMAeMmiCzYtawEStMYtZCNIZBcOeEIB0glhiTRkT0qaXuB9I0m3Dd`, data, {
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    });
                //console.log(response.data);
               
                res.json({ status: "success", });
            // }
    
        }
        else{

            const intentToSend = stateProduct.trim().toLowerCase();

try {
    let intentData: any[] = [];
    const node_details = await Node.findAll({
        where: {
            intent: intentToSend,
        },
    });

    for (const node of node_details) {
        const { type, node_id } = node;
        let nodeData;
        let message_data;
        switch (type) {
            case 'textOnly':
                nodeData = await FlowTextOnly.findOne({ where: { node_id } });
                message_data = {
                    recipient: {
                        id: message_body.sender.id
                    },
                    messaging_type: "RESPONSE",
                    message: {
                        text: nodeData.text,
                    },
                };
                break;
            case 'textinput':
                nodeData = await FlowTextBox.findOne({ where: { node_id } });
                message_data = {
                    recipient: {
                        id: message_body.sender.id
                    },
                    message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [
                                    {
                                        title: nodeData.title,
                                        subtitle: nodeData.description
                                    }
                                ],
                            },
                        },
                    },
                };
                break;
            case 'cardStyleOne':
                nodeData = await FlowCardData.findOne({ where: { node_id } });
                message_data = {
                    recipient: {
                        id: message_body.sender.id
                    },
                    message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [
                                    {
                                        title: nodeData.title,
                                        subtitle: nodeData.description,
                                        image_url: 'https://flow-builder-chi.vercel.app/images/Slide%2006.png'
                                    },
                                ],
                            },
                        },
                    },
                };
                break;
            case 'buttonGroup': {
                const buttonsFromDb = await Node.findAll({ where: { parentId: node_id } });
                const buttons = await Promise.all(
                    buttonsFromDb.map(async (button: any) => {
                        const button_data = await FlowButtonData.findOne({ where: { node_id: button.node_id } });
                        const button_edge = await Edge.findOne({ where: { source: button.node_id } });
                        if(button_data){
                        if(button_edge){
                            return {
                            
                                type: "postback",
                                title: button_data.text,
                                payload:button.node_id
                            };
                        }
                        else{
                            return {
                            
                                type: "web_url",
                                title: button_data.text,
                                url:button_data.link ? button_data.link : "#"
                            };
                        }
                        }
                        
                    })
                    );
                message_data = {
                    recipient: {
                        id: message_body.sender.id
                    },
                    message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "button",
                                text:"Please select a option?",
                                buttons: buttons
                            }
                        }
                    }
                };
                console.log("message DATA",buttons);

                break;
            }
            case 'cardGroup': {
                const childs = await Node.findAll({ where: { parentId: node_id } });
                let cardElements: any[] = [];
                let buttons: any[] = [];
                let title = "-";
                let subtitle = "-";
                let image_url = "-";
                await Promise.all(childs.map(async child => {
                    if (child.type === 'cardHeader') {
                        const cardData = await FlowCardData.findOne({ where: { node_id: child.node_id } });
                       
                        if (cardData) {
                            title = cardData.title;
                            subtitle = cardData.description;
                            image_url = 'https://flow-builder-chi.vercel.app/images/Slide%2006.png';
            
                        }
                    } else {
                        const buttonData = await FlowButtonData.findOne({ where: { node_id: child.node_id } });
                        const button_edge = await Edge.findOne({ where: { source: child.node_id } });
                        if (buttonData) {
                            if(button_edge){
                                buttons.push({
                                    type: "postback",
                                    title: buttonData.text,
                                    payload: child.node_id 
                                });
                            }
                            else{
                                buttons.push({
                                    type: "web_url",
                                    title: buttonData.text,
                                    url:buttonData.link ? buttonData.link : "#"
                                });
                            }
                            
                        }
                    }
                }));
                
                message_data = {
                    recipient: {
                        id: message_body.sender.id
                    },
                    message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [
                                    {
                                        title:title,
                                        image_url:image_url,
                                        subtitle:subtitle,
                                        buttons : buttons
                                    },
                                ],
                            },
                        },
                    },
                };
                break;
            }
            default:
                continue;
        }
        intentData.push(message_data);  // Add each message_data to intentData array
    }

    // Send all collected messages
    for (const data of intentData) {
       
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=EAAF348C6zRwBOygEAVOQDjd3QK5YhIHbGGmdDDca0HDaDEbS0sdlEqPycuP7satY9GPf6QPhYTVdUawRe7XTZBAQkaAT6rPrqNVICUNjcYxuZApRs6YjzUYpqxzUtbW1lUSyN2z4VhLhMAeMmiCzYtawEStMYtZCNIZBcOeEIB0glhiTRkT0qaXuB9I0m3Dd`, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    res.json({ status: "success" });

} catch (error) {
    console.error('Error retrieving intent data:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
}

        }
        

    } catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }





};
