// controllers/indexController.ts
import { Request, Response } from 'express';

export const getBotFlowPage = (req: Request, res: Response) => {
    res.render('botFlow');
};
