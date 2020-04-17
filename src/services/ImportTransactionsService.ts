import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import parse from 'csv-parse';

import uploadConfig from '../config/upload';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import CreateTransactionService, { Request } from './CreateTransactionService';

interface RequestFile {
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
  async execute({ file }: RequestFile): Promise<Transaction[]> {
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
    });

    const mapSeries = async (
      iterable: CsvTransaction[],
      action: ({
        title,
        value,
        type,
        category,
      }: Request) => Promise<Transaction>,
    ) => {
      for (const x of iterable) {
        return await action(x);
      }
    };

    const hmm = createTransaction.execute;

    const transactionsss = await mapSeries(parsedTransactions, hmm);
    console.log('ImportTransactionsService -> transactionsss', transactionsss);

    return transactions;
  }
}

export default ImportTransactionsService;
