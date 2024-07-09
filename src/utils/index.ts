import { Request, Response } from "express";

import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeAndExtractShopifyShop(
    url: string,
): Promise<string> {
    try {
        // Fetch the HTML content of the URL
        const response = await axios.get(url);
        const html = response.data;

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        // Find all script tags
        const scripts = $("script");

        // Search for "Shopify.shop" in each script tag
        let shopifyShopValue = null;
        scripts.each((index: number, element: any) => {
            const scriptContent = $(element).html();
            if (scriptContent) {
                const match = scriptContent.match(
                    /Shopify\.shop\s*=\s*["']([^"'.]+)(?:\.myshopify\.com)?["']/,
                );

                if (match) {
                    shopifyShopValue = match[1];
                }
            }
        });

        if (shopifyShopValue) {
            return shopifyShopValue;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error scraping the URL:", error.message);
        return null;
    }
}

interface Branding {
    fonts: string[];
    colors: string[];
    images: string[];
}

function extractFirstFontUrl(cssContent: string): string[] {
    const fontFaceRegex = /@font-face\s*{[^}]+}/g;
    const fontUrlRegex = /url\((["'])((?:https?:)?\/\/[^)]+)\1\)/;

    const fontFaceMatch = fontFaceRegex.exec(cssContent);
    if (fontFaceMatch) {
        const urlMatch = fontFaceMatch[0].match(fontUrlRegex);
        if (urlMatch && urlMatch[2]) {
            // Remove leading '//' if present
            return [urlMatch[2].replace(/^\/\//, "")];
        }
    }

    return [];
}
function extractColorsFromCSS(cssContent: string): string[] {
    const colorRegex = /--color-foreground:\s*([^;]+);/g;
    const matches = cssContent.matchAll(colorRegex);
    return Array.from(matches, m => m[1].trim());
}

export async function scrapeWebsite(url: string): Promise<Branding> {
    try {
        console.log("Fetching URL...");
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        console.log("Page loaded successfully!");

        const images = $("img")
            .map((_: any, el: any) => {
                let src = $(el).attr("src");
                if (src) {
                    // Remove leading '//' if present
                    return src.replace(/^\/\//, "");
                }
                return null;
            })
            .get()
            .filter((src: string | null): src is string => src !== null)
            .slice(0, 3);
        console.log(`Found ${images.length} images.`);

        const styleTag = $("style[data-shopify]");
        if (styleTag.length) {
            const cssContent = styleTag.html() || "";
            const fontFaces = extractFirstFontUrl(cssContent);
            const colors = extractColorsFromCSS(cssContent);
            console.log(
                `Extracted ${fontFaces.length} @font-face rules and ${colors.length} colors from <style> tag.`,
            );

            return {
                fonts: fontFaces,
                colors: colors,
                images: images,
            };
        } else {
            console.log("No <style> tag with data-shopify attribute found.");
            return {
                fonts: [],
                colors: [],
                images: images,
            };
        }
    } catch (error) {
        console.error("An error occurred:", error);
        return {
            fonts: [],
            colors: [],
            images: [],
        };
    }
}

export async function checkURLAndProductTitle(req: Request, res: Response) {
    const url = req.query.url as string;
    if (!url) {
        res.status(400).json({ error: "Missing URL query parameter" });
        return;
    }
    const productTitle = url.match(/products\/([^\/]+)/)?.[1] ?? null;
    const val = await scrapeAndExtractShopifyShop(url);
    return { productTitle, val, url };
}

export async function scrapeWebsiteForProductDetails(url: string) {
    console.log("Fetching URL...");
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    console.log("Page loaded successfully!");

    const escapeRegex = /\\(["\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    const newlineRegex = /\s+/g;

    function cleanText(text: string): string {
        return text
            .replace(escapeRegex, "$1")
            .replace(newlineRegex, " ")
            .trim();
    }

    function extractSrc($element: any): string {
        const img = $element.find("img").first();
        let src = img.attr("src") || "";
        // Remove leading '//' if present
        return src.replace(/^\/\//, "");
    }

    const details = {
        description: cleanText($(".product__description").text()),
        title: cleanText($(".product__title").text()),
        media: extractSrc($(".product__media")),
        header: cleanText($(".header__heading").html() || ""),
    };

    return details;
}

export async function shopifyApi({
    subdomain,
    productTitle,
    isCollection,
}: {
    subdomain: string;
    productTitle: string;
    isCollection: boolean;
}) {
    const { data } = await axios.get(
        `${process.env.API_ENDPOINT}subdomain=${subdomain}&product_title=${productTitle}&is_collection=${isCollection}`,
    );

    return data;
}

export async function shopifyApiGetProductDetails({
    subdomain,
    productTitle,
    isCollection,
    url,
}: {
    subdomain: string;
    productTitle: string;
    isCollection: boolean;
    url: string;
}) {
    const data = await shopifyApi({ subdomain, productTitle, isCollection });

    const details = {
        description: "",
        title: "",
        media: "",
        fonts: "",
    };
    const product = data?.product;
    if (product) {
        details.description = product?.description ?? "";
        details.title = product?.title ?? "";
        details.media = product.url?.url ?? product.url?.alt_text ?? "";
    }
    const scrapedData = await scrapeWebsite(url);
    details.fonts = scrapedData.fonts.join(", ");

    return details;
}
