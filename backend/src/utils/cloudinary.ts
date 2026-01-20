import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      })
      .end(buffer);
  });
};
