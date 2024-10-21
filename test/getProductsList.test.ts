import { handler } from '../src/handlers/getProductsList';
import { getAllProducts } from '../src/services/productService';

jest.mock('../src/services/productService');

const mockProductItem = {
  description: "Short Product Description7",
  id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
  price: 15,
  title: "ProductTitle",
  count: 2,
}

jest.mocked(getAllProducts).mockResolvedValue([mockProductItem]);

test('getProductList.handler should return products', async () => {
  expect(await handler()).toEqual([mockProductItem]);
})