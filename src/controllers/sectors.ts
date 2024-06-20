import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const sectorAdd = async (req: Request, res: Response) => {
    const {sector_name, email} = req.body;
    //console.log(req.body);
    try {
        await prisma.sector.create({
          data: {
            email: email,
            sector_name: sector_name,
          },
        });
      return res.json({status:"success", message:"Sector Added"})
      
      } catch (error) {
        return res.json({status:"failed", message:`${error}`})
      }
};


export const sectorEdit = async (req: Request, res: Response) => {
  const {sector_name, email} = req.body;
  let id: number | undefined = parseInt(req.body.id as string, 10);
  //console.log(req.body);
  try {
      await prisma.sector.updateMany({
        where: { id: id},
        data: { email: email,sector_name: sector_name },
      });
    return res.json({status:"success", message:"Sector Updated"})
    
    } catch (error) {
      return res.json({status:"failed", message:`${error}`})
    }
};