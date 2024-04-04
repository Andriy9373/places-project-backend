const multer = require('multer');
const uuid = require('uuid');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const fileUpload = multer({
    limits: 500000,
    storage: multer.diskStorage({
        filename: (req, file, callback) => {
            const ext = MIME_TYPE_MAP[file.mimetype];
            callback(null, uuid.v1() + '.' + ext);
        },
        destination: (req, file, callback) => {
            callback(null, 'uploads/images');
        },
    }),
    fileFilter: (req, file, callback) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        const error = isValid ? null : new Error('Invalid mime type');
        callback(error, isValid);
    }
});

module.exports = fileUpload;