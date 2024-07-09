import { Router } from "express";
import * as controller from "../controllers/index";

export const index = Router();

index.get("/", controller.index);
index.get("/get_product_branding", controller.productBranding);
index.get("/get_product_details", controller.productDetails);
