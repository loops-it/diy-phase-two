import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const addQuestion = async (req: Request, res: Response) => {
    const {question, language} = req.body;
    //console.log(req.body);
    let intent: number | undefined = parseInt(req.body.intent as string, 10);
    try {
        await prisma.question.create({
          data: {
            question: question,
            intent: intent,
            language: language,
          },
        });  
      return res.json({status:"success", message:"Question Added"})
      
      } catch (error) {
        return res.json({status:"failed", message:`${error}`})
      }
};