const jwt = require('jsonwebtoken');
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            throw new Error('Authentication failed');
        }
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        req.token = decodedToken;
        req.userData = { userId: decodedToken.userId };
        next();
    } catch (err) {
        console.log(err);
        const error = new HttpError('Authentication failed', 403);
        return next(error);
    }
}