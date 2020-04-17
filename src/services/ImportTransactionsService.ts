import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import parse from 'csv-parse';

import uploadConfig from '../config/upload';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  file: string;
}

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

type PromiseCsvParse = (
  input: string,
  options?: parse.Options,
) => Promise<CsvTransaction[]>;

const csvParse: PromiseCsvParse = promisify(parse);

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, file);
    const fileExists = await fs.promises.stat(filePath);

    if (!fileExists) {
      throw new AppError('File does not exists.');
    }

    const transactions: Transaction[] = [];
    const createTransaction = new CreateTransactionService();
    const inputFile = await (await fs.promises.readFile(filePath)).toString();
    const parsedTransactions = await csvParse(inputFile, {
      delimiter: ', ',
      columns: true,
      cast: (csvValue, context) => {
        if (context.column === 'value') {
          return parseInt(csvValue, 10);
        }

        return csvValue;
      },
    });

    /* eslint-disable-next-line no-restricted-syntax */
    for (const parsedTransaction of parsedTransactions) {
      /* eslint-disable-next-line no-await-in-loop */
      const transaction = await createTransaction.execute(parsedTransaction);
      transactions.push(transaction);
    }

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
