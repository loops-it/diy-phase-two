import "dotenv/config";
import { Request as ExpressRequest, Response } from 'express';

interface RequestWithChatId extends ExpressRequest {
    userChatId?: string;
}


export const chatFlowData = async (req: RequestWithChatId, res: Response) => {
    
    try {

        const chatId = req.body.chatId;
        // Process the chatId or other data as needed


        const productData = [
            {
                id: 1,
                name: 'Savings account',
                desc: 'DFCC Bank offers a variety of savings account types to cater to different needs. Here are some of the savings account types available',
                list: [
                    {
                        id: 1,
                        text: 'DFCC Aloka'
                    },
                    {
                        id: 2,
                        text: 'DFCC Freelancer'
                    },
                    {
                        id: 3,
                        text: 'Investment planner'
                    }
                ]
            }
        ]

        res.json({productData: productData});


    } catch (error) {
        console.error("Error processing question:", error);
        res.status(500).json({ error: "An error occurred." });
    }

};