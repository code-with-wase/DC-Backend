import { Router } from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controller/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:productId/:size", updateCartItem);
router.delete("/items/:productId/:size", removeCartItem);
router.delete("/", clearCart);

export default router;
