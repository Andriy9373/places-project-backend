require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const placesRoute = require('./routes/places');
const usersRoute = require('./routes/users');
const HttpError = require('./models/http-error');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/api/places', placesRoute);
app.use('/api/users', usersRoute);

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    next(error);
})

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err => {
            console.log(err);
        });
    }
    if (res.headerSend) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'Something went wrong' });
})

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vpkefk7.mongodb.net/`)
    .then(() => {
        console.log('app is running');
        app.listen(process.env.PORT || 5000);
    })
    .catch(error => {
        console.log(error);
    })
