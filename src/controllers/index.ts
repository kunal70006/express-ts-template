import { Request, Response } from "express";
import {
    checkURLAndProductTitle,
    scrapeWebsite,
    scrapeWebsiteForProductDetails,
    shopifyApiGetProductDetails,
} from "../utils";

/**
 * GET /
 * Home page.
 */
export const index = async (req: Request, res: Response): Promise<void> => {
    res.json("Hello, World!");
};

export const productBranding = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { productTitle, val, url } = await checkURLAndProductTitle(req, res);
    if (val && productTitle) {
        const branding = await scrapeWebsite(url);
        res.status(200).json({ ...branding });
        // TODO: send data to shopify api
        // const data = await shopifyApi.getProduct(productTitle, val, isCollection);
        // if(!data){
        //     const branding = await scrapeWebsite(url);
        //     res.status(200).json({ ...branding });
        // }
        return;
    } else {
        res.status(400).json({ error: "Invalid URL or no data found" });
        return;
    }
};

export const productDetails = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { productTitle, val, url } = await checkURLAndProductTitle(req, res);
    if (val && productTitle) {
        shopifyApiGetProductDetails({
            productTitle,
            subdomain: val,
            isCollection: false,
            url: url,
        })
            .then(data => {
                res.status(200).json({ ...data });
                return;
            })
            .catch(err => {
                scrapeWebsite(url)
                    .then(branding => res.status(200).json({ ...branding }))
                    .catch(err => res.status(400).json({ error: err.message }));
                res.status(400).json({ error: err.message });
                return;
            });

        const branding = await scrapeWebsite(url);
        res.status(200).json({ ...branding });
        return;
    } else {
        const branding = await scrapeWebsite(url);
        res.status(200).json({ ...branding });
        return;
    }
};
