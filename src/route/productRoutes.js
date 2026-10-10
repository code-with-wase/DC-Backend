
import { Router } from "express";

import {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  getAdminProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from "../controller/productController.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = Router();

// Public product routes
router.get("/all", getProducts);
router.get("/details/:id", getProductById);
router.get("/slug/:slug", getProductBySlug);

// Admin product routes
router.get("/admin/all", protect, adminOnly, getAdminProducts);
router.get("/admin/details/:id", protect, adminOnly, getAdminProductById);
router.post("/admin/create", protect, adminOnly, createProduct);
router.patch("/admin/update/:id", protect, adminOnly, updateProduct);
router.delete("/admin/delete/:id", protect, adminOnly, deleteProduct);

export default router;
