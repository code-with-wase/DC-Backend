import mongoose from "mongoose";
import Cart from "../model/Cart.js";
import Product from "../model/Product.js";

const createCartError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const validateProductId = (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw createCartError("A valid product ID is required.");
  }
};

const validateSize = (size) => {
  if (typeof size !== "string" || !size.trim()) {
    throw createCartError("A product size is required.");
  }

  return size.trim();
};

const validateQuantity = (quantity) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw createCartError("Quantity must be a positive whole number.");
  }
};

const getOrCreateCart = async (userId) => {
  try {
    return await Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw error;
    }

    return cart;
  }
};

const getCartData = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug price originalPrice images sizes stock isActive",
  });

  const items = (cart?.items ?? []).map((item) => {
    const product = item.product;
    const available = Boolean(
      product && product.isActive && product.stock >= item.quantity
    );
    const unitPrice = product ? product.price : null;

    return {
      product: product
        ? {
            id: product._id.toString(),
            name: product.name,
            slug: product.slug,
            price: product.price,
            originalPrice: product.originalPrice,
            images: product.images,
            sizes: product.sizes,
          }
        : null,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      subtotal: available ? unitPrice * item.quantity : 0,
      isAvailable: available,
    };
  });

  return {
    items,
    summary: {
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.subtotal, 0),
    },
  };
};

const getCart = async (userId) => getCartData(userId);

const addToCart = async (userId, data = {}) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createCartError("A valid cart item is required.");
  }

  const { productId, quantity = 1 } = data;
  const size = validateSize(data.size);

  validateProductId(productId);
  validateQuantity(quantity);

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw createCartError("Product is not available.", 404);
  }

  if (!product.sizes.includes(size)) {
    throw createCartError("Selected size is not available for this product.");
  }

  if (product.stock < quantity) {
    throw createCartError("Requested quantity exceeds available stock.", 409);
  }

  await getOrCreateCart(userId);

  let cart = await Cart.findOneAndUpdate(
    {
      user: userId,
      items: {
        $elemMatch: {
          product: product._id,
          size,
          quantity: { $lte: product.stock - quantity },
        },
      },
    },
    { $inc: { "items.$.quantity": quantity } },
    { new: true }
  );

  if (!cart) {
    cart = await Cart.findOneAndUpdate(
      {
        user: userId,
        items: {
          $not: {
            $elemMatch: { product: product._id, size },
          },
        },
      },
      { $push: { items: { product: product._id, size, quantity } } },
      { new: true }
    );
  }

  if (!cart) {
    cart = await Cart.findOneAndUpdate(
      {
        user: userId,
        items: {
          $elemMatch: {
            product: product._id,
            size,
            quantity: { $lte: product.stock - quantity },
          },
        },
      },
      { $inc: { "items.$.quantity": quantity } },
      { new: true }
    );
  }

  if (!cart) {
    throw createCartError("Requested quantity exceeds available stock.", 409);
  }

  return getCartData(userId);
};

const updateCartItem = async (userId, productId, sizeValue, quantity) => {
  validateProductId(productId);
  const size = validateSize(sizeValue);
  validateQuantity(quantity);

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw createCartError("Product is not available.", 404);
  }

  if (!product.sizes.includes(size)) {
    throw createCartError("Selected size is not available for this product.");
  }

  if (product.stock < quantity) {
    throw createCartError("Requested quantity exceeds available stock.", 409);
  }

  const cart = await Cart.findOneAndUpdate(
    {
      user: userId,
      items: { $elemMatch: { product: product._id, size } },
    },
    { $set: { "items.$.quantity": quantity } },
    { new: true }
  );

  if (!cart) {
    return null;
  }

  return getCartData(userId);
};

const removeCartItem = async (userId, productId, sizeValue) => {
  validateProductId(productId);
  const size = validateSize(sizeValue);

  const cart = await Cart.findOneAndUpdate(
    {
      user: userId,
      items: { $elemMatch: { product: productId, size } },
    },
    { $pull: { items: { product: productId, size } } },
    { new: true }
  );

  if (!cart) {
    return null;
  }

  return getCartData(userId);
};

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } }
  );

  return getCartData(userId);
};

export {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
