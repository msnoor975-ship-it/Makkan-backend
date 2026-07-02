const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const uploadImage = async (req, res) => {
  try {
    const { type = 'house' } = req.body
    const bucketMap = {
      house: 'house-images',
      customer: 'customer-images',
      agent: 'agent-images',
      homeowner: 'homeowner-images'
    }
    
    const bucket = bucketMap[type] || 'house-images'
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileName = `${type}-${Date.now()}-${Math.round(Math.random() * 1E9)}${req.file.originalname}`
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return res.status(500).json({ error: 'Error uploading to Supabase' })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    res.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Error uploading file' })
  }
}

module.exports = { uploadImage }
