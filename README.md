# DC-Backend

## Cart API

All cart endpoints require an authenticated user. Send the JWT in the
`Authorization: Bearer <token>` header. Each cart is stored separately for the
user identified by that token; the API does not accept a user ID from the
request body.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/cart` | Get the authenticated user's cart |
| `POST` | `/cart/items` | Add a product and size; optional `quantity` defaults to `1` |
| `PATCH` | `/cart/items/:productId/:size` | Set an item's quantity |
| `DELETE` | `/cart/items/:productId/:size` | Remove a product/size combination |
| `DELETE` | `/cart` | Clear the authenticated user's cart |

Example add request:

```json
{
  "productId": "PRODUCT_MONGODB_ID",
  "size": "M",
  "quantity": 1
}
```

Adding the same product and size again increases its quantity. Different sizes
are stored as separate cart items. Product availability and stock are checked
when adding or changing a quantity; the cart response includes current product
details, item subtotals, availability, and a cart summary.
