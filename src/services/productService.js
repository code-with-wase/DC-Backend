
import mongoose from "mongoose";
import Product from "../model/Product.js";

const allowedFields = [
  "name",
  "slug",
  "description",
  "price",
  "originalPrice",
  "images",
  "sizes",
  "tags",
  "category",
  "stock",
  "isActive",
];

const createError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const createSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const pickAllowedFields = (data) =>
  Object.fromEntries(
    Object.entries(data).filter(([key]) =>
      allowedFields.includes(key)
    )
  );

const validateProductData = (data, existingProduct = {}) => {
  const product = { ...existingProduct, ...data };

  if (
    product.price === undefined ||
    product.originalPrice === undefined
  ) {
    throw createError("Price and original price are required.");
  }

  if (
    !Number.isFinite(product.price) ||
    !Number.isFinite(product.originalPrice) ||
    product.price < 0 ||
    product.originalPrice < product.price
  ) {
    throw createError(
      "Original price must be greater than or equal to selling price."
    );
  }

  if (!Array.isArray(product.images) || product.images.length === 0) {
    throw createError("At least one product image is required.");
  }

  if (
    product.images.some(
      (image) =>
        typeof image !== "string" || image.trim().length === 0
    )
  ) {
    throw createError("Every product image must be a valid non-empty string.");
  }

  if (!Array.isArray(product.sizes) || product.sizes.length === 0) {
    throw createError("At least one product size is required.");
  }

  if (
    product.sizes.some(
      (size) =>
        typeof size !== "string" || size.trim().length === 0
    )
  ) {
    throw createError("Every product size must be a non-empty string.");
  }

  if (
    product.stock !== undefined &&
    (!Number.isInteger(product.stock) || product.stock < 0)
  ) {
    throw createError("Stock must be a non-negative whole number.");
  }

  if (
    product.tags !== undefined &&
    (!Array.isArray(product.tags) ||
      product.tags.some((tag) => typeof tag !== "string"))
  ) {
    throw createError("Tags must be an array of strings.");
  }
};

const formatProduct = (product, isAdmin = false) => {
  const item =
    typeof product.toObject === "function"
      ? product.toObject()
      : { ...product };

  item.id = String(item._id ?? item.id);

  item.discount =
    item.originalPrice > 0
      ? Math.round(
          ((item.originalPrice - item.price) /
            item.originalPrice) *
            100
        )
      : 0;

  delete item._id;
  delete item.__v;

  if (!isAdmin) {
    delete item.stock;
    delete item.isActive;
  }

  return item;
};

const createProduct = async (data) => {
  const payload = pickAllowedFields(data);

  if (!payload.name || typeof payload.name !== "string") {
    throw createError("Product name is required.");
  }

  payload.slug = payload.slug
    ? createSlug(payload.slug)
    : createSlug(payload.name);

  if (!payload.slug) {
    throw createError("A valid product slug could not be generated.");
  }

  if (payload.tags === undefined) {
    payload.tags = [];
  }

  validateProductData(payload);

  const product = await Product.create(payload);

  return formatProduct(product, true);
};

const getProducts = async (query = {}, isAdmin = false) => {
  const {
    search,
    category,
    tag,
    minPrice,
    maxPrice,
    sort = "newest",
  } = query;

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 12)
  );

  const filter = {};

  if (!isAdmin) {
    filter.isActive = true;
  }

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tags = tag.toLowerCase();
  }

  if (search) {
    filter.$text = { $search: search };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined && minPrice !== "") {
      const value = Number(minPrice);

      if (!Number.isFinite(value) || value < 0) {
        throw createError("Invalid minimum price.");
      }

      filter.price.$gte = value;
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const value = Number(maxPrice);

      if (!Number.isFinite(value) || value < 0) {
        throw createError("Invalid maximum price.");
      }

      filter.price.$lte = value;
    }

    if (
      filter.price.$gte !== undefined &&
      filter.price.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      throw createError("Minimum price cannot exceed maximum price.");
    }
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceLowToHigh: { price: 1 },
    priceHighToLow: { price: -1 },
    nameAZ: { name: 1 },
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products: products.map((product) =>
      formatProduct(product, isAdmin)
    ),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProductById = async (id, isAdmin = false) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const filter = { _id: id };

  if (!isAdmin) {
    filter.isActive = true;
  }

  const product = await Product.findOne(filter);

  return product ? formatProduct(product, isAdmin) : null;
};

const getProductBySlug = async (slug) => {
  const product = await Product.findOne({
    slug: slug.toLowerCase(),
    isActive: true,
  });

  return product ? formatProduct(product) : null;
};

const updateProduct = async (id, data) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const payload = pickAllowedFields(data);
  const product = await Product.findById(id);

  if (!product) {
    return null;
  }

  if (payload.name !== undefined && !payload.slug) {
    payload.slug = createSlug(payload.name);
  } else if (payload.slug !== undefined) {
    payload.slug = createSlug(payload.slug);
  }

  validateProductData(payload, product.toObject());

  Object.assign(product, payload);

  await product.save();

  return formatProduct(product, true);
};

const deleteProduct = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Product.findByIdAndDelete(id);
};

export {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};
