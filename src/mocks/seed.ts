import {DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall} from "@aws-sdk/util-dynamodb";
import {productsData, stockData} from "./data";
import {Product, Stock} from "../types/types";


const client = new DynamoDBClient({region: "us-east-1"});

const populateProducts = async (products: Product[]) => {
  for (const product of products) {
    const params = {
      TableName: "Products",
      Item: marshall(product),
    };
    try {
        await client.send(new PutItemCommand(params));
        console.log(`Inserted product with id: ${product.id}`);
     } catch (error) {
        console.log('Error inserting item', error);
     }
  
  }
};

const populateStock = async (stock: Stock[]) => {
  for (const item of stock) {
    const params = {
      TableName: "Stock",
      Item: marshall(item),
    };
    try {
        await client.send(new PutItemCommand(params));
        console.log(`Inserted stock item with id: ${item.product_id}`);
     } catch (error) {
        console.log('Error inserting item', error);
     }
  }
}

populateProducts(productsData);
populateStock(stockData)