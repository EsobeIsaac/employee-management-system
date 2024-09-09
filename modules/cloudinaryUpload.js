import cloudinary from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



let cloudinaryUpload = (buffer, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        console.log('Upload Stream Callback');
        if (error) {
          console.log('Error during Cloudinary upload:', error);
          return reject(error);
        }
        console.log('Cloudinary Upload Result:', result);
        return resolve(result);
      }
    );

    if (!stream) {
      console.log('Stream not created');
    }

    const readStream = streamifier.createReadStream(buffer);
    if (!readStream) {
      console.log('Read stream not created');
    }

    readStream.pipe(stream);

    console.log('Buffer piped into Cloudinary stream');
  });
};


export default cloudinaryUpload
