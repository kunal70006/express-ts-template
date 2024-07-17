import axios from "axios";
import * as cheerio from "cheerio";
import { CollectionDetails, ProductDetails, StoreDetails } from "./types";

const htmlToPlainText = (html: string): string =>
    html
        .replace(/<[^>]+>|\n|\r/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getBaseURL = (url: string): string =>
    url.match(/^(https?:\/\/[^\/]+)/)?.[0] ?? "";

const getRecommendedProducts = async ({
    url,
    productId,
}: {
    url: string;
    productId: string;
}): Promise<Omit<ProductDetails, "productRecommendations">[]> => {
    try {
        const baseURL = getBaseURL(url);

        if (baseURL) {
            const res = await axios.get(
                `${baseURL}/recommendations/products.json?product_id=${productId}&limit=3`,
            );
            const data = await res.data;
            const recommendations = data?.products?.map((product: any) => {
                return {
                    title: product.title,
                    description: htmlToPlainText(product?.description ?? ""),
                    image: product.featured_image,
                };
            });
            return recommendations;
        }

        return [];
    } catch (err) {
        return [];
    }
};

export const getProductDetails = async (
    url: string,
): Promise<ProductDetails> => {
    try {
        const res = await axios.get(`${url}.json`);
        const data = await res.data;
        const productId = data.product?.id;
        const returnObj: ProductDetails = {
            description: "",
            image: "",
            productRecommendations: [],
            title: "",
        };
        if (productId) {
            returnObj.title = data.product.title ?? "";
            returnObj.description = htmlToPlainText(
                data.product.body_html ?? "",
            );
            returnObj.image = data.product.image.src ?? "";
            returnObj.productRecommendations = await getRecommendedProducts({
                productId,
                url,
            });
        }
        return returnObj;
    } catch (e) {
        return {
            title: "",
            description: "",
            image: "",
            productRecommendations: [],
        };
    }
};

export const getCollectionDetails = async (
    url: string,
): Promise<CollectionDetails> => {
    try {
        const baseURL = getBaseURL(url);
        const collectionTitle = url.match(/\/collections\/([^\/]+)/)?.[1];

        const res = await axios.get(
            `${baseURL}/search/suggest.json?q=${collectionTitle}&resources[type]=collection`,
        );
        const data = await res.data;

        const collectionData = {
            title:
                data?.resources?.results?.collections[0]?.title ??
                collectionTitle,
            collectionImage:
                data?.resources?.results?.collections[0]?.featured_image?.url ??
                "",
        };

        // Search API https://shopify.dev/docs/api/ajax/reference/predictive-search
        // tags of a product often contain the collection handle
        // that's why we're searching for tags first so we can get accurate products within a collection
        const productsInCollectionRes = await axios.get(
            `${baseURL}/search/suggest.json?q=${collectionTitle}&resources[type]=product&resources[options][fields]=tag&resources[limit]=3`,
        );

        let pData = await productsInCollectionRes.data;
        // if no products are found by searching tags
        // we search for products by collection title
        // this reduces the accuracy but works as a reliable fallback
        if (pData?.resources?.results?.products?.length === 0) {
            const productsInCollectionRes = await axios.get(
                `${baseURL}/search/suggest.json?q=${collectionTitle}&resources[type]=product&resources[limit]=3`,
            );
            pData = await productsInCollectionRes.data;
        }

        const productData = pData?.resources?.results?.products?.map(
            (product: any) => {
                return {
                    title: product?.title ?? "",
                    description: htmlToPlainText(product?.body ?? "") ?? "",
                    image: product?.image ?? "",
                    url: `${baseURL}${product?.url}`,
                };
            },
        );
        const collectionDetails = {
            ...collectionData,
            products: [...productData],
        };
        return collectionDetails;
    } catch (e) {
        return {
            title: "",
            collectionImage: "",
            products: [],
        };
    }
};

function extractFirstFontUrl(cssContent: string): string {
    const fontFaceRegex = /@font-face\s*{[^}]+}/g;
    const fontUrlRegex = /url\((["'])((?:https?:)?\/\/[^)]+)\1\)/;

    const fontFaceMatch = fontFaceRegex.exec(cssContent);
    if (fontFaceMatch) {
        const urlMatch = fontFaceMatch[0].match(fontUrlRegex);
        if (urlMatch && urlMatch[2]) {
            // Remove leading '//' if present
            return urlMatch[2].replace(/^\/\//, "");
        }
    }
    return "";
}
function extractColorsFromCSS(cssContent: string): string[] {
    const colorRegex = /--color-foreground:\s*([^;]+);/g;
    const matches = cssContent.matchAll(colorRegex);
    return Array.from(matches, m => m[1].trim());
}

export async function scrapeWebsite(url: string): Promise<StoreDetails> {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const image = $("img")
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
            .slice(0, 3)
            .filter(img => img.toLowerCase().includes("logo"))[0];

        const styleTag = $("style[data-shopify]");
        if (styleTag.length) {
            const cssContent = styleTag.html() || "";
            const fontFaces = extractFirstFontUrl(cssContent);
            const colors = extractColorsFromCSS(cssContent);

            return {
                font: fontFaces,
                colors: colors,
                logo: image,
            };
        } else {
            return {
                font: "",
                colors: [],
                logo: image,
            };
        }
    } catch (error) {
        return {
            font: "",
            colors: [],
            logo: "",
        };
    }
}

export const getStoreDetailsUtil = async (
    url: string,
): Promise<StoreDetails> => {
    // we still have to scrap the website once to get
    // font, website theme colors and logo
    return await scrapeWebsite(url);
};
