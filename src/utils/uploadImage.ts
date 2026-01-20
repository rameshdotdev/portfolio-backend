import cloudinary from "../config/cloudinary.js";

export const uploadBase64Image = async (base64: string, folder = "avatars") => {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const getPublicIdFromUrl = (url: string) => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  const folderPath = parts.slice(parts.indexOf("upload") + 1, parts.length - 1);

  const publicId = [...folderPath, fileName.split(".")[0]].join("/");
  return publicId;
};

export const deleteFromCloudinary = async (publicId: string) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
