import {Handler} from 'aws-lambda';
import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({region: "us-east-1"});

export const getProductsById: Handler = async (event) => {
  try {
    if (!event.id) {
      throw new Error('Missing product id');
    }

    const productCommand = new GetItemCommand({
      TableName: 'Products',
      Key: {
        "id": {S: event.id},
      },
    });
    const productResponse = await client.send(productCommand);

    let product;

    if (productResponse.Item) {
      product = unmarshall(productResponse.Item)
    }

    const stockCommand = new GetItemCommand({
      TableName: 'Stock',
      Key: {
        "product_id": {S: event.id},
      }
    });

    const stockResponse = await client.send(stockCommand);
    let stock;
    if (stockResponse.Item) {
      stock = unmarshall(stockResponse.Item)
    }

    if (!product || !stock) {
      throw new Error('Product not found');
    }

    return {...product, count: stock.count};
  } catch (error) {
    let status = 500;

    return {
      statusCode: status,
      body: JSON.stringify({
        error: 'There was an error while fetching the product: ' + error + event.id
      }),
    };
  }
}