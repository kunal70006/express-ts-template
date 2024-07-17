import { Request, Response } from "express";
import {
    getProductDetails,
    getCollectionDetails,
    getStoreDetailsUtil,
} from "../utils";

export const getProductOrCollectionDetails = async (
    req: Request,
    res: Response,
) => {
    const url = req.query.url as string;
    const isCollectionRegex = /\/collections\/(?!.*\/products\/)/;
    const isCollection = isCollectionRegex.test(url);
    if (isCollection) {
        try {
            const data = await getCollectionDetails(url);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    try {
        const data = await getProductDetails(url);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const getStoreDetails = async (req: Request, res: Response) => {
    const url = req.query.url as string;
    try {
        const data = await getStoreDetailsUtil(url);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
