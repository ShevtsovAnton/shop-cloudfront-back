import {v4} from "uuid";
import {Product, Stock} from "../types/types";

export const productsData: Product[] = [
  {
    id: v4(),
    title: "title 1",
    description: "description 1",
    price: 50
  },
  {
    id: v4(),
    title: "title 2",
    description: "description 2",
    price: 40
  },
  {
    id: v4(),
    title: "title 3",
    description: "description 3",
    price: 35
  },
  {
    id: v4(),
    title: "title 4",
    description: "description 4",
    price: 40
  },
  {
    id: v4(),
    title: "title 5",
    description: "description 5",
    price: 45
  },
  {
    id: v4(),
    title: "title 6",
    description: "description 6",
    price: 40
  },
  {
    id: v4(),
    title: "title 7",
    description: "description 7",
    price: 35
  }
];


export const stockData: Stock[] = productsData.map(
  (product) => ({
    product_id: product.id,
    count: Math.floor(Math.random() * 50) + 1,
  })
);