import { Request, Response } from "express";
import {
    checkURLAndProductTitle,
    scrapeWebsite,
    scrapeWebsiteForProductDetails,
    shopifyApiGetProductBrandingDetails,
    shopifyApiGetProductDetails,
} from "../utils";
import axios from "axios";

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
        const { productTitle, val, url } = await checkURLAndProductTitle(
            req,
            res,
        );

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
        const { productTitle, val, url } = await checkURLAndProductTitle(
            req,
            res,
        );

        let data;

        if (val && productTitle) {
            try {
                data = await shopifyApiGetProductDetails({
                    productTitle,
                    subdomain: val,
                    isCollection: false,
                    url: url,
                });

                if (Object.values(data).every(val => val === "")) {
                    throw new Error("Empty data from Shopify API");
                }
            } catch (err) {
                console.error("Shopify API failed:", err);
                data = await scrapeWebsiteForProductDetails(url);

                if (Object.values(data).some(val => val === "")) {
                    const { data: jsData } = await axios.get(`${url}.js`);
                    console.log(jsData);
                    data = {
                        title: jsData.title,
                        description: jsData.description,
                        media: jsData.featured_image,
                    };
                }
            }
        } else {
            data = await scrapeWebsiteForProductDetails(url);
        }

        res.status(200).json(data);
    } catch (err) {
        console.error("Error in productDetails:", err);
        res.status(400).json({ error: err.message });
    }
};
