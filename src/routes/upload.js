const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const { uploadImage } = require('../controllers/uploadController')

// Single image upload with error handling
router.post('/', (req, res, next) => {
  console.log('Upload route hit')
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err)
      return res.status(400).json({ error: err.message })
    }
    console.log('Multer upload successful, file:', req.file)
    next()
  })
}, uploadImage)

module.exports = router
