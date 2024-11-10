import {Handler} from 'aws-lambda';
import {DynamoDBClient, TransactWriteItemsCommand, TransactWriteItemsCommandInput} from "@aws-sdk/client-dynamodb";
import {randomUUID} from "crypto";
import { PayloadProduct } from '../types/types';

const dynamoDB = new DynamoDBClient({region: 'us-east-1'});

export const createProduct = async (product: PayloadProduct) => {
  const productId = randomUUID();;
  const params: TransactWriteItemsCommandInput = {
    TransactItems: [
      {
        Put: {
          TableName: 'Products',
          Item: {
            id: { S: productId },
            title: { S: product.title },
            description: { S: product.description },
            price: { N: product.price.toString() },
          },
        },
      },
      {
        Put: {
          TableName: 'Stock',
          Item: {
            product_id: { S: productId },
            count: { N: product.count.toString() },
          },
        },
      },
    ],
  };

  const transactWriteProductCommand = new TransactWriteItemsCommand(params);

  await dynamoDB.send(transactWriteProductCommand);

  return productId;
}

