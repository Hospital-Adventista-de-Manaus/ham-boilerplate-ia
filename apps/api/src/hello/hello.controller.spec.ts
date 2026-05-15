import { Test } from '@nestjs/testing';
import { HelloController } from './hello.controller';

describe('HelloController', () => {
  let controller: HelloController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HelloController],
    }).compile();

    controller = moduleRef.get<HelloController>(HelloController);
  });

  it('retorna a saudação padrão sem nome', () => {
    const result = controller.hello();
    expect(result.message).toBe('Hello, World!');
    expect(result.from).toBe('api');
    expect(result.name).toBeUndefined();
    expect(typeof result.timestamp).toBe('string');
  });

  it('saúda usando o nome quando fornecido', () => {
    const result = controller.hello('Ana');
    expect(result.message).toBe('Hello, Ana!');
    expect(result.name).toBe('Ana');
  });

  it('trunca nomes muito longos para evitar abuso', () => {
    const longName = 'A'.repeat(200);
    const result = controller.hello(longName);
    expect(result.name?.length).toBe(50);
  });
});
