const mongoose = require('mongoose');
const fs = require('fs');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.id;

    let data = null;
    try {
        data = await Place.findById(placeId); 
    } catch (err) {
        const error = new HttpError('Could not find a place for the provided id.', 404);
        return next(error);
    }

    if (!data) {
        const error = new HttpError('Could not find a place for the provided id.', 404);
        return next(error);
    }

    return res.status(200).json({ data, statusCode: 200 });
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.id;

    let data = null;
    try {
        data = await Place.find({ creator: userId });
    } catch (err) {
        const error = new HttpError('Could not find a place for the provided user id.', 404);
        return next(error);
    }

    if (data.length === 0) {
        const error = new HttpError('Could not find a place for the provided user id.', 404);
        return next(error);
    }
    res.status(200).json({ data, statusCode: 200 });
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed. Please check your data', 422);
        return next(error);
    }
    const { title, description, coordinates, address } = req.body;

    let user = null;
    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('Creating place failed', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user', 404);
        return next(error);
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        const createdPlace = new Place({
            title,
            description,
            image: req.file.path,
            location: coordinates,
            address,
            creator: req.userData.userId,
        });
        await createdPlace.save({ session });
        user.places.push(createdPlace);
        await user.save({ session });
        session.commitTransaction();

        res.status(201).json({ data: createdPlace, statusCode: 201 });
    } catch (err) {
        const error = new HttpError('Creating place failed', 500);
        return next(error);
    }
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed. Please check your data', 422);
        return next(error);
    }
    const { title, description } = req.body;
    const placeId = req.params.id;

    let place = null;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Could not update place', 500);
        return next(error);
    }

    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError('You are not allowed to edit this place', 403);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError('Could not update place', 500);
        return next(error);
    }

    return res.status(200).json({ data: place, statusCode: 200 });
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.id;

    let place = null;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError('Could not delete place', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find place', 404);
        return next(error);
    }

    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError('You are not allowed to delete this place', 403);
        return next(error);
    }

    const imagePath = place.image;
    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await place.deleteOne({ session });
        place.creator.places.pull(place);
        await place.creator.save({ session });
        await session.commitTransaction();

    } catch (err) {
        const error = new HttpError('Could not delete place', 500);
        return next(error);
    }

    fs.unlink(imagePath, err => {
        console.log(err);
    })

    res.status(200).json({ message: 'Deleted place', statusCode: 204 });
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;