const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createBooking, getMyBookings, cancelBooking } = require('../controllers/bookingsController');

router.post('/', authenticateToken, createBooking);
router.get('/me', authenticateToken, getMyBookings);
router.delete('/', authenticateToken, cancelBooking);

module.exports = router;

