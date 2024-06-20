import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
const bodyParser = require('body-parser');
const pdfParse = require('pdf-parse');
import multer from 'multer';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

export const agentCreateAccount = async (req: Request, res: Response, next: Function) => {
     
    try {
      const {name, phone, email, password, language} = req.body;

      let file_name = req.protocol + '://' + req.get('host')+ '/uploads/agent.png';
      console.log(req.body);
        const email_exist = await prisma.user.findFirst({
          where: { email: email },
        });
      if(email_exist){
        return res.json({status:"failed", message:`Email has already registered`})
      }
      else{
          const crypt_password = await (bcrypt.hash(password, 10));
            const user = await prisma.user.create({
              data: {
                email: email,
                password: crypt_password,
                user_role: 2,
                status: "active",
              },
            });
            if (req.file) {
              const file = req.file;
              const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
              console.log(blob); 
              file_name = blob.url
              //res.render('uploadedFilePreview', { filename: file.originalname, blobUrl: blob.url });
            }
            await prisma.agent.create({
              data: {
                user_id: user.id,
                name: name,
                phone:phone,
                status:"active",
                profile_picture:file_name,
              },
            });
            // for (var i = 0; i < language.length; i++) {
            //       await prisma.agentLanguages.create({
            //         data: {
            //           user_id: user.id,
            //           language: language[i],
            //         },
            //       });
            // }
            const languagesArray = language.split(',');
            for (const language of languagesArray) { 
              await prisma.agentLanguages.create({
                data: {
                  user_id: user.id,
                  language: language,
                },
              });
            }

            return res.json({status:"success", message:"Agent Added"})
      }
      } catch (error) {
        return res.json({status:"failed", message:`${error}`})
      }
};

export const agentUpdateAccount = async (req: Request, res: Response, next: Function) => {
  const {name, phone, email,language} = req.body
  const languagesArray = language.split(',');
  let user_id: number | undefined = parseInt(req.body.user_id as string, 10);
  try {
    const email_exist = await prisma.user.findFirst({
      where: { email: email },
    });
  if(email_exist){
      if(email_exist.id == user_id){
        if (req.file) {
          const file = req.file;
          const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
          const profile_picture = blob.url
          await prisma.agent.updateMany({
            where: { user_id: user_id },
            data: { name: name,phone: phone, profile_picture : profile_picture},
          });
        }
        else{
          await prisma.agent.updateMany({
            where: { user_id: user_id },
            data: { name: name,phone: phone},
          });
        }
            await prisma.user.updateMany({
              where: { id: user_id },
              data: { email: email},
            });
          await prisma.agentLanguages.deleteMany({
              where: { user_id: user_id },
          });
    
            for (const language of languagesArray) {
              await prisma.agentLanguages.create({
                data: {
                  user_id: user_id,
                  language: language,
                },
              });
            }
          return res.json({status:"success", message:"Agent Updated"})
      }
      else{
          return res.json({status:"failed", message:"Email has already registered"})
      }    
  }
  else{
            if (req.file) {
              const file = req.file;
              const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
              const profile_picture = blob.url
              await prisma.agent.updateMany({
                where: { user_id: user_id },
                data: { name: name,phone: phone, profile_picture : profile_picture},
              });
            }
            else{
              await prisma.agent.updateMany({
                where: { user_id: user_id },
                data: { name: name,phone: phone},
              });
            }

            await prisma.user.updateMany({
              where: { id: user_id },
              data: { email: email},
            });
          await prisma.agentLanguages.deleteMany({
              where: { user_id: user_id },
          });
          for (const language of languagesArray) {
            await prisma.agentLanguages.create({
              data: {
                user_id: user_id,
                language: language,
              },
            });
          }
      return res.json({status:"success", message:"Agent Updated"})
  }
  } catch (error) {
    return res.json({status:"failed", message:`${error}`})
  }
};

export const agentUpdateWithPassword = async (req: Request, res: Response, next: Function) => {
  const {name, phone, email, password,language} = req.body
  const languagesArray = language.split(',');
  let user_id: number | undefined = parseInt(req.body.user_id as string, 10);
  const crypt_password = await (bcrypt.hash(password, 10));
  try {
    const email_exist = await prisma.user.findFirst({
      where: { email: email },
    });
  if(email_exist){
      if(email_exist.id == user_id){
        if (req.file) {
          const file = req.file;
          const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
          const profile_picture = blob.url
          await prisma.agent.updateMany({
            where: { user_id: user_id },
            data: { name: name,phone: phone, profile_picture : profile_picture},
          });
        }
        else{
          await prisma.agent.updateMany({
            where: { user_id: user_id },
            data: { name: name,phone: phone},
          });
        }
            await prisma.user.updateMany({
              where: { id: user_id },
              data: { email: email,password: crypt_password},
            });
            await prisma.agentLanguages.deleteMany({
              where: { user_id: user_id },
            });
          for (var i = 0; i < language.length; i++) {
            await prisma.agentLanguages.create({
              data: {
                user_id: user_id,
                language: language[i],
              },
            });
          }
          return res.json({status:"success", message:"Agent Updated"})
      }
      else{
          return res.json({status:"failed", message:"Email has already registered"})
      }    
  }
  else{
    if (req.file) {
      const file = req.file;
      const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
      const profile_picture = blob.url
      await prisma.agent.updateMany({
        where: { user_id: user_id },
        data: { name: name,phone: phone, profile_picture : profile_picture},
      });
    }
    else{
      await prisma.agent.updateMany({
        where: { user_id: user_id },
        data: { name: name,phone: phone},
      });
    }
    await prisma.user.updateMany({
      where: { id: user_id },
      data: { email: email,password: crypt_password},
    });
    await prisma.agentLanguages.deleteMany({
      where: { user_id: user_id },
    });
      for (var i = 0; i < language.length; i++) {
        await prisma.agentLanguages.create({
          data: {
            user_id: user_id,
            language: language[i],
          },
        });
      }
      return res.json({status:"success", message:"Agent Updated"})
  }
  } catch (error) {
    return res.json({status:"failed", message:`${error}`})
  }
};


