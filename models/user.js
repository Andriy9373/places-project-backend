const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, requires: true },
    email: { type: String, requires: true, unique: true },
    password: { type: String, requires: true, minlength: 6 },
    image: { type: String, requires: true },
    places: [{ type: mongoose.Types.ObjectId, requires: true, ref: 'Place' }],
});

module.exports = mongoose.model('User', userSchema);