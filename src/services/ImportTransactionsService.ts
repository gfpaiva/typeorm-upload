// import { In } from 'typeorm';
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

/* interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
} */

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

  // ========= BULK INSERT =========
  // async execute(filePath: string): Promise<Transaction[]> {
  //   const contactsReadStream = fs.createReadStream(filePath);

  //   const parsers = parse({
  //     delimiter: ',',
  //     from_line: 2,
  //   });

  //   const parseCSV = contactsReadStream.pipe(parsers);

  //   const transations: CSVTransaction[] = [];
  //   const categories: string[] = [];

  //   parseCSV.on('data', async line => {
  //     const [title, type, value, category] = line.map((cell: string) =>
  //       cell.trim(),
  //     );

  //     if (!title || !type || !value) return;

  //     categories.push(category);
  //     transations.push({ title, type, value, category });
  //   });

  //   await new Promise(resolve => parseCSV.on('end', resolve));

  //   const existentCategories = await categoriesRepository.find({
  //     where: {
  //       title: In(categories)
  //     }
  //   });

  //   const existentCategoriesTitles = existentCategories.map(category: Category => category.title);

  //   const addCategoryTitles = categories
  //     .filter(category => !existentCategoriesTitles.includes(category))
  //     .filter((value, index, self) => self.indexOf(value) === index);

  //   const newCategories = categoriesRepository.create(
  //     addCategoryTitles.map(title => ({ title }))
  //   );

  //   await categoriesRepository.save(newCategories);

  //   const finalCategories = [...newCategories, ...existentCategories];

  //   const createdTransnactions = transactionRepository.create(
  //       transations.map(transaction => ({
  //         title: transaction.title,
  //         type: transaction.type,
  //         value: transaction.value,
  //         category: finalCategories.find(category => category.title === transaction.category)
  //       }))
  //     );

  //     await transactionRepository.save(createdTransnactions);

  //     await fs.promises.unlink(filePath);
  // }
}

export default ImportTransactionsService;
