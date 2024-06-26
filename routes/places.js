const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
    getPlaceById,
    getPlacesByUserId,
    createPlace,
    updatePlace,
    deletePlace,
} = require('../controllers/places');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

router.get('/user/:id', getPlacesByUserId);
router.get('/:id', getPlaceById);

router.use(checkAuth);

router.post(
    '/',
    fileUpload.single('image'),
    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 5 }),
        check('address')
            .not()
            .isEmpty(),
    ],
    createPlace
);
router.patch(
    '/:id',
    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 5 }),
    ],
    updatePlace
);
router.delete('/:id', deletePlace);

module.exports = router;