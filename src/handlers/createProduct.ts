import {Handler} from 'aws-lambda';
import {DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";
import {randomUUID} from "crypto";

const dynamoDB = new DynamoDBClient({region: 'us-east-1'});

export const createProduct: Handler = async (event) => {
  try {

    const id = randomUUID();
    const createProductCommand = new PutItemCommand({
      TableName: 'Products',
      Item: {
        id: {S: id},
        title: {S: event.title},
        price: {N: event.price},
        description: {S: event.description},
      }
    });

    await dynamoDB.send(createProductCommand);

    const createStockCommand = new PutItemCommand({
      TableName: 'Stock',
      Item: {
        product_id: {S: id},
        count: {N: event.count},
      }
    });

    await dynamoDB.send(createStockCommand);

    return {
      statusCode: 200,
      body: "Product Created",
    }
  } catch (error) {
    let status = 500;

    return {
      statusCode: status,
      body: JSON.stringify({
        error: 'There was an error while fetching the product: ' + error + event
      }),
    };
  }
};