const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {

    let users = null;
    try {
        users = await User.find({}, '-password');
    } catch(err) {
        const error = new HttpError('Fetching users failed', 500);
        return next(error);
    }
    res.status(200).json({ data: users, statusCode: 200 });
}

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed. Please check your data', 422);
        return next(error);
    }
    const { name, email, password } = req.body;

    let existingUser = null;
    try {
        existingUser = await User.findOne({ email });
    } catch (err) {
        const error = new HttpError('Something went wrong', 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError('User already exists', 422);
        return next(error);
    }

    let hashedPassword = null;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create a user', 500);
        return next(error);
    }
    
    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: [],
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Could not create a user', 500);
        return next(error);
    }

    let token = null;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.SECRET_KEY,
            { expiresIn: '1h' },
        )
    } catch (err) {
        const error = new HttpError('Sign up failed, please try again later', 500);
        return next(error);
    }

    res.status(201).json({ data: createdUser, statusCode: 201, token });
}

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser = null;
    try {
        existingUser = await User.findOne({ email });
    } catch (err) {
        const error = new HttpError('Something went wrong', 500);
        return next(error);
    }

    if (!existingUser) {
        const error = new HttpError('Could not identify user. No user with this password.', 401);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch(err) {
        const error = new HttpError('Could not identify user. No user with this password.', 401);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Could not identify user. No user with this password.', 401);
        return next(error);
    }

    let token = null;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            process.env.SECRET_KEY,
            { expiresIn: '1h' },
        )
    } catch (err) {
        console.log(err);
        const error = new HttpError('Sign in failed, please try again later', 500);
        return next(error);
    }

    res.status(200).json({ message: 'Logged in!', statusCode: 200, data: existingUser, token });
}

module.exports.getUsers = getUsers;
module.exports.signup = signup;
module.exports.login = login;