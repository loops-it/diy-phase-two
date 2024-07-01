// controllers/indexController.ts
import { Request, Response } from 'express';

export const twilioView = (req: Request, res: Response) => {
    res.render('twilioCall');
};
