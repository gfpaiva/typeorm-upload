import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

import CreateCategoryService from './CreateCategoryService';

export interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();

    const isTransactionDebtBalance = type === 'outcome' && value > total;
    if (isTransactionDebtBalance) {
      throw new AppError(
        `This transaction cannot be made. Outcome value ($ ${value}) is bigger than the total in balance ($ ${total}).`,
        400,
      );
    }

    const createCategory = new CreateCategoryService();
    const { id: category_id } = await createCategory.execute({
      title: category,
    });

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
