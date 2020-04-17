import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

import AppError from '../errors/AppError';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      if (file.mimetype !== 'text/csv') {
        throw new AppError('File is not a valid csv', 400);
      }

      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
