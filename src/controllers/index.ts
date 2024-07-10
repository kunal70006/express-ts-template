import { Request, Response } from "express";
import {
    checkURLAndProductTitle,
    scrapeWebsite,
    scrapeWebsiteForProductDetails,
    shopifyApiGetProductBrandingDetails,
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
    try {
        const { productTitle, val, url, isCollection } =
            await checkURLAndProductTitle(req, res);

        if (val && productTitle) {
            try {
                const data = await shopifyApiGetProductBrandingDetails({
                    productTitle,
                    subdomain: val,
                    isCollection: false,
                    url: url,
                });
                res.status(200).json({ ...data });
            } catch (err) {
                // If Shopify API fails, fall back to scraping
                const branding = await scrapeWebsite(url);
                res.status(200).json({ ...branding });
            }
        } else {
            const branding = await scrapeWebsite(url);
            res.status(200).json({ ...branding });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const productDetails = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { productTitle, val, url, isCollection } =
            await checkURLAndProductTitle(req, res);

        if (val && productTitle) {
            try {
                const data = await shopifyApiGetProductDetails({
                    productTitle,
                    subdomain: val,
                    isCollection: false,
                    url: url,
                });
                if (Object.values(data).every(val => val === "")) {
                    // If Shopify API fails, fall back to scraping
                    const branding = await scrapeWebsiteForProductDetails(url);
                    res.status(200).json({ ...branding });
                    return;
                }
                res.status(200).json({ ...data });
            } catch (err) {
                // If Shopify API fails, fall back to scraping
                const branding = await scrapeWebsiteForProductDetails(url);
                res.status(200).json({ ...branding });
            }
        } else {
            const branding = await scrapeWebsiteForProductDetails(url);
            res.status(200).json({ ...branding });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
