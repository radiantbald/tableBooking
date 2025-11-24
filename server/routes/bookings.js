const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createBooking, getMyBookings, cancelBooking, cancelAllBookings, checkBookings, createMultipleBookings } = require('../controllers/bookingsController');

router.post('/', authenticateToken, createBooking);
router.get('/me', authenticateToken, getMyBookings);
router.delete('/', authenticateToken, cancelBooking);
router.delete('/all', authenticateToken, cancelAllBookings);
router.post('/check', authenticateToken, checkBookings);
router.post('/multiple', authenticateToken, createMultipleBookings);

module.exports = router;

