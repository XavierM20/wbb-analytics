const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  name: String,
  image: {
    data: Buffer, // Binary data for the image
    contentType: String // MIME type (e.g., image/png, image/jpeg)
  }
});

const Image = mongoose.model('Image', ImageSchema);
module.exports = Image;
