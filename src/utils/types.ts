export interface ProductDetails {
    title: string;
    description: string;
    image: string;
    productRecommendations: Omit<ProductDetails, "productRecommendations">[];
}

interface ProductInCollection
    extends Omit<ProductDetails, "productRecommendations"> {
    url: string;
}

export interface CollectionDetails {
    title: string;
    collectionImage: string;
    products: ProductInCollection[];
}

export interface StoreDetails {
    font: string;
    colors: string[];
    logo: string;
}
