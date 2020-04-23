import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    // Number(value)
    const incomeBalance = transactions.reduce(
      (prev, { type, value }) => (type === 'income' ? prev + value : prev),
      0,
    );
    // Number(value)
    const outcomeBalance = transactions.reduce(
      (prev, { type, value }) => (type === 'outcome' ? prev + value : prev),
      0,
    );
    const total = incomeBalance - outcomeBalance;

    return {
      income: incomeBalance,
      outcome: outcomeBalance,
      total,
    };
  }
}

export default TransactionsRepository;
