const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const uploadImage = async (req, res) => {
  try {
    console.log('Upload request received')
    console.log('File:', req.file)
    
    if (!req.file) {
      console.log('No file in request')
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Upload to Supabase Storage
    const fileName = `house-${Date.now()}-${Math.round(Math.random() * 1E9)}${req.file.originalname}`
    const { data, error } = await supabase.storage
      .from('house-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return res.status(500).json({ error: 'Error uploading to Supabase' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('house-images')
      .getPublicUrl(fileName)

    console.log('Image uploaded successfully:', publicUrl)
    
    res.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Error uploading file' })
  }
}

module.exports = { uploadImage }
