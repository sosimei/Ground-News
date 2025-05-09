const express = require('express');
const router = express.Router();

// Removed image handling functionality as requested
router.get('/:id', async (req, res) => {
  res.status(404).send('Image handling has been removed');
});

module.exports = router;