import { handler } from '../src/handlers/getProductById';
import { getProductById } from '../src/services/productService';

jest.mock('../src/services/productService');

const mockProductItem = {
  description: "Short Product Description7",
  id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
  price: 15,
  title: "ProductTitle",
  count: 2,
}


beforeEach(() => {
  jest.clearAllMocks();
});

test('getProductById.handler should return product by id', async () => {
  jest.mocked(getProductById).mockResolvedValue(mockProductItem);

  const result = await handler({ id: mockProductItem.id });

  expect(getProductById).toHaveBeenCalledWith(mockProductItem.id);
  expect(result).toBe(mockProductItem);
})

test('getProductById.handler should should throw an error when product not found',() => {
  jest.mocked(getProductById).mockResolvedValue(undefined);

  expect(handler({ id: mockProductItem.id })).rejects.toThrow('Product not found');
})