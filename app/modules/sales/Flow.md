**Creating Sales Order**
1. Receive the customer ID, due date, and products.
2. Confirm a customer ID and at least one order line were submitted.
3. Confirm every line has a product, valid quantity, and valid price.
4. Confirm the customer belongs to the current organization.
5. Collect all submitted product IDs.
6. Confirm all products exist and belong to the organization.
7. Start a database transaction.
8. Create the main sales order.
9. Create every sales order line connected to it.
10. Retrieve the full order with its customer and lines.
11. Return the completed order with a 201 status.