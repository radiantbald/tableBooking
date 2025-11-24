const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getDesks } = require('../controllers/desksController');

router.get('/', authenticateToken, getDesks);

module.exports = router;

