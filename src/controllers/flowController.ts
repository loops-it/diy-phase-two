// controllers/indexController.ts
import { Request, Response } from 'express';

export const getFlowPage = async (req: Request, res: Response) =>{
    res.render('flow-test');
};
