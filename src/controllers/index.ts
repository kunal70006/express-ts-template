import { Request, Response } from "express";
import {
    // checkURLAndProductTitle,
    // scrapeWebsite,
    // scrapeWebsiteForProductDetails,
    // shopifyApiGetProductBrandingDetails,
    // shopifyApiGetProductDetails,
    getProductDetails,
    getCollectionDetails,
} from "../utils";
import axios from "axios";

export interface ProductOrCollectionDetails {
    title: string;
    description: string;
    image: string;
    productRecommendations: Omit<
        ProductOrCollectionDetails,
        "productRecommendations"
    >[];
    font: string;
}

export const getProductOrCollectionDetails = async (
    req: Request,
    res: Response,
) => {
    const url = req.query.url as string;
    const isCollectionRegex = /\/collections\/(?!.*\/products\/)/;
    const isCollection = isCollectionRegex.test(url);
    if (isCollection) {
        // return getCollectionDetails(url);
    }
    const data = await getProductDetails(url);
    return res.status(200).json(data);
};

export const getStoreDetails = async (
    req: Request,
    res: Response,
): Promise<void> => {};

// export const productBranding = async (
//     req: Request,
//     res: Response,
// ): Promise<void> => {
//     try {
//         const { productTitle, val, url } = await checkURLAndProductTitle(
//             req,
//             res,
//         );

//         if (val && productTitle) {
//             try {
//                 const data = await shopifyApiGetProductBrandingDetails({
//                     productTitle,
//                     subdomain: val,
//                     isCollection: false,
//                     url: url,
//                 });
//                 res.status(200).json({ ...data });
//             } catch (err) {
//                 // If Shopify API fails, fall back to scraping
//                 const branding = await scrapeWebsite(url);
//                 res.status(200).json({ ...branding });
//             }
//         } else {
//             const branding = await scrapeWebsite(url);
//             res.status(200).json({ ...branding });
//         }
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// export const productDetails = async (
//     req: Request,
//     res: Response,
// ): Promise<void> => {
//     try {
//         const { productTitle, val, url } = await checkURLAndProductTitle(
//             req,
//             res,
//         );

//         let data;

//         if (val && productTitle) {
//             try {
//                 data = await shopifyApiGetProductDetails({
//                     productTitle,
//                     subdomain: val,
//                     isCollection: false,
//                     url: url,
//                 });

//                 if (Object.values(data).every(val => val === "")) {
//                     throw new Error("Empty data from Shopify API");
//                 }
//             } catch (err) {
//                 console.error("Shopify API failed:", err);
//                 data = await scrapeWebsiteForProductDetails(url);

//                 if (Object.values(data).some(val => val === "")) {
//                     const { data: jsData } = await axios.get(`${url}.js`);
//                     console.log(jsData);
//                     data = {
//                         title: jsData.title,
//                         description: jsData.description,
//                         media: jsData.featured_image,
//                     };
//                 }
//             }
//         } else {
//             data = await scrapeWebsiteForProductDetails(url);
//         }

//         res.status(200).json(data);
//     } catch (err) {
//         console.error("Error in productDetails:", err);
//         res.status(400).json({ error: err.message });
//     }
// };
