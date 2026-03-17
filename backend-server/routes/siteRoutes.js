const express = require('express');
const router = express.Router();
const { getSites, createSite, updateSite, deleteSite } = require('../controllers/siteController');

router.route('/')
    .get(getSites)
    .post(createSite);

router.route('/:id')
    .put(updateSite)
    .delete(deleteSite);

module.exports = router;
