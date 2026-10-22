import * as cartService from "../services/cartService.js";

export const getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.user._id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const data = await cartService.addToCart(req.user._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Product added to cart.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const data = await cartService.updateCartItem(
      req.user._id,
      req.params.productId,
      req.params.size,
      req.body?.quantity
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const data = await cartService.removeCartItem(
      req.user._id,
      req.params.productId,
      req.params.size
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart item removed.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const data = await cartService.clearCart(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Cart cleared.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
