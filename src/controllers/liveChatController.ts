import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import bcrypt from 'bcrypt';
import { Translate } from "@google-cloud/translate/build/src/v2";
import jwt, { JwtPayload } from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface UserDecodedToken extends JwtPayload {
  id: string;
  
}
 
var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "2bf02341e7caef",
      pass: "4ad3976e23311c"
    }
  });
  const translate = new Translate({
    key: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const switchToAgent = async (req: Request, res: Response, next: NextFunction) => {
    const {chatId} = req.body
    try {
        const onlineUser = await prisma.user.findFirst({where: { online_status: 'online',status: 'active',user_role: 2 } });
        console.log("onlineUser", onlineUser);
        if(onlineUser){
            const chat_header_exist = await prisma.chatHeader.findFirst({where: { message_id: chatId }  });
            
            const queued_chats  = await prisma.chatHeader.count({where: { agent: "unassigned",status: "live" }  });
            
            if(chat_header_exist){
                res.json({ status: "success",queued_chats:queued_chats }) 
            }else{
                const chat_main =  await prisma.botChats.findFirst({where: { message_id: chatId }  });
               
                const chats = await prisma.botChats.findMany({
                    where: {
                        message_id: chatId
                    },
                    orderBy: { id: 'asc' }, 
                  });

                if(chat_main){
                await prisma.chatHeader.create({
                    data: {
                        message_id: chatId,
                        language: chat_main.language,
                        status: "live",
                        agent: "unassigned",
                    },
                  });
                }
    
                for (var c = 0; c < chats.length; c++) {
                    await prisma.liveChat.create({
                        data: {
                            message_id: chatId,
                            sent_by: chats[c].message_sent_by,
                            message: chats[c].message,
                        },
                      });
                }
                await prisma.botChats.deleteMany({where: { message_id: chatId }  });

                res.json({ status: "success",queued_chats:queued_chats }) 
            }   
        }
       else{
        res.json({ status: "fail"}) 
       }
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
};

export const liveChat = async (req: Request, res: Response, next: NextFunction) => {
const {chatId} = req.body
try {
    
    const chat_header_result  = await prisma.chatHeader.findFirst({where: { message_id: chatId }  });
      
    const chat_body_result = await prisma.liveChat.findFirst({
        where: { 
            message_id: chatId,
            sent_by: 'agent',
            sent_to_user: 'no',
        },
        orderBy: { id: 'asc' },  
    });
    
    if(chat_header_result){
        if(chat_header_result.agent == "unassigned"){
            let agent_id = null;
            let chat_status = null;
            let agent_message = null;
            let agent_name = null;
            let profile_picture = null;
            let is_time_out = null;
    
              res.json({ agent_id, chat_status, agent_message, agent_name, profile_picture, is_time_out });
        }
        else{
        let agent_name;
        let profile_picture;
        let agent_message;
        let agent: number | undefined = parseInt(chat_header_result.agent as string, 10);
        console.log("agent",agent);
        const agent_details = await prisma.agent.findFirst({where: { user_id: agent }  });
        
        if (agent_details) {
            agent_name = agent_details.name;
            profile_picture = agent_details.profile_picture;
          }
          else{
            agent_name = null;
            profile_picture = null;
          }
          
        if (chat_body_result) {
            agent_message = chat_body_result.message;
            await prisma.liveChat.updateMany({
                where: {  id: chat_body_result.id },
                data: {  sent_to_user:"yes" },
            });
        }
        else {
            agent_message = null;
          }
          let agent_id = chat_header_result.agent;
          let chat_status = chat_header_result.status;
          let is_time_out = chat_header_result.is_time_out;
          res.json({ agent_id, chat_status, agent_message, agent_name, profile_picture, is_time_out });
        }
    }
    else{
        let agent_id = null;
        let chat_status = null;
        let agent_message = null;
        let agent_name = null;
        let profile_picture = null;
        let is_time_out = null;

          res.json({ agent_id, chat_status, agent_message, agent_name, profile_picture, is_time_out });
    }
}
catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "An error occurred." });
}
};


export const liveChatUser = async (req: Request, res: Response, next: NextFunction) => {
    const {chatId,user_message, language} = req.body
    try {
        
        const chat_header_exist = await prisma.chatHeader.findFirst({where: { message_id: chatId }  });
        
        if(chat_header_exist){

            await prisma.liveChat.create({
                data: {
                    message_id: chatId,
                    sent_by: 'customer',
                    message: user_message,
                    viewed_by_agent : 'no'
                },
            });
        }
        else{
            await prisma.chatHeader.create({
                data: {
                    message_id: chatId,
                    language: language,
                    status: "live",
                    agent: "unassigned",
                },
            });
            await prisma.liveChat.create({
                data: {
                    message_id: chatId,
                    sent_by: 'customer',
                    message: user_message,
                    viewed_by_agent : 'no'
                },
            });
        }
        res.json({ status : "success" });
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
    };

export const saveRating = async (req: Request, res: Response, next: NextFunction) => {
    const {ratingValue,feedbackMessage,chatId} = req.body
    try {
        await prisma.chatHeader.updateMany({
            where: { message_id: chatId },
            data: { rating:ratingValue,feedback:feedbackMessage },
        });
        res.json({ status: "success" })
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
};

export const chatUserClose = async (req: Request, res: Response, next: NextFunction) => {
    const {chatId} = req.body
    try {
        await prisma.chatHeader.updateMany({
            where: { message_id: chatId },
            data: { status:"closed" },
        });
        res.json({ status: "success" })
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
};
export const chatTimeOut = async (req: Request, res: Response, next: NextFunction) => {
    const {chatId} = req.body
    try {
        await prisma.chatHeader.updateMany({
            where: { message_id: chatId },
            data: { status:"closed",is_time_out:"yes" },
        });
        res.json({ status: "success" })
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
};

export const offlineFormSubmissions = async (req: Request, res: Response, next: NextFunction) => {
    const {chatId, name, email, subject, message, language} = req.body
    try {
        const is_form_exist = await prisma.offlineFormSubmissions.findFirst({where: { chat_id: chatId }  });
        
        if(is_form_exist){
            res.json({ status: "fail",message: "You have already submitted this form." })
        }
        else{

            await prisma.offlineFormSubmissions.create({
                data: {
                    chat_id: chatId,
                    name: name,
                    email: email,
                    subject: subject,
                    message: message,
                },
            });

            const sectorsArray = await prisma.sector.findMany({
                distinct: ['sector_name'],
                select: {
                  id: true,
                  sector_name: true,
                },
              });

            const sectorList = sectorsArray.map(item => ({
                sector: item.sector_name,
                id: item.id
            }));

            let translatedMessage = "";
            
            if (language == "Sinhala") {
                translatedMessage = await translateToEnglish(message);
            } else if (language === "Tamil") {
                translatedMessage = await translateToEnglish(message);
            } else {
                translatedMessage = message;
            }
            async function translateToEnglish(message: string) {
                const [translationsToEng] = await translate.translate(message, "en");
                const finalMessage = Array.isArray(translationsToEng)
                    ? translationsToEng.join(", ")
                    : translationsToEng;
                return finalMessage;
            }
            console.log("translatedMessage",translatedMessage);

            const prompt = `Compare the given user message: "${translatedMessage}" with the sector list: ${JSON.stringify(sectorList)} and if the user message matches a sector in the sector list, then give only the id in that sector list. Do not state anything else. if you cannot find a match then just say "not a sector".`;

            const isSector = await openai.completions.create({
                model: "gpt-3.5-turbo-instruct",
                prompt: prompt,
                max_tokens: 20,
                temperature: 0,
            });
            let isSectorAnswer: string | null = isSector.choices[0].text;

            console.log("isSectorAnswer",isSectorAnswer);

            if (isSectorAnswer && (await isSectorAnswer).toLowerCase().includes("not a sector")) {
                res.json({ status: "fail",message: "Sector not found." })
                console.log("sector","not found");
            }
            else{ 
            const sector_id = (isSectorAnswer).trim().toLowerCase();
            let id: number | undefined = parseInt(sector_id as string, 10);

            const sector = await prisma.sector.findFirst({where: { id: id }  });
            console.log("sector",sector);
            if(sector){
                const emailText = `
                    New offline form submission:

                    Chat ID: ${chatId}
                    Name: ${name}
                    Email: ${email}
                    Subject: ${subject}
                    Message: ${message}
                `;

            const mailOptions = {
                from: 'mail@dfcc.lk',
                to: sector.email,
                subject: 'Offline Form Submission',
                text: emailText
            };

            transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error occurred:', error.message);
                    return;
                }
                console.log('Email sent:', info.response);
            });

            res.json({ status: "success",message: "Your message has been sent." }) 
            }
            else{
            res.json({ status: "fail",message: "Sector not found." })
            }   
        }

        }     
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
};

export const directConnectAgent = async (req: Request, res: Response, next: NextFunction) => {
    const {language} = req.body
    try {
        let chatId = req.body.chatId || "";
        const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
            const day = ('0' + currentDate.getDate()).slice(-2);
            const hours = ('0' + currentDate.getHours()).slice(-2);
            const minutes = ('0' + currentDate.getMinutes()).slice(-2);
            const seconds = ('0' + currentDate.getSeconds()).slice(-2);

            const prefix = 'chat';
            chatId = `${prefix}_${year}${month}${day}_${hours}${minutes}${seconds}`;
        
        await prisma.chatHeader.create({
            data: {
                message_id: chatId,
                language: language,
                status: "live",
                agent: "unassigned",
            },
        });

        res.json({ status: "success",chatId: chatId })
    }
    catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }
};
