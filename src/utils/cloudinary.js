import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) =>  {
  try {
    // local file path unavailble
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file uploaded successfully
    console.log(
      "file uploaded on cloudinary successfully URL : ",
      response.url
    );
    return response;
  } catch (error) {
    // delete localy save file who got error
    fs.unlinkSync(localFilePath);
  }
};

export { uploadOnCloudinary };
