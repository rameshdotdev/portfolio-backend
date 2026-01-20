import type { Request, Response } from "express";
import Hero from "../models/Hero.model.js";
import { deleteFromCloudinary } from "../utils/uploadImage.js";

/* 📥 Get hero content (PUBLIC) */
export const getHero = async (_: Request, res: Response) => {
  try {
    const hero = await Hero.findOne({});
    return res.status(200).json(hero);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch hero data" });
  }
};

/* ✏️ Update hero content (ADMIN) */
export const updateHero = async (req: Request, res: Response) => {
  try {
    const { characters } = req.body;

    // ✅ Basic validations
    if (!Array.isArray(characters)) {
      return res.status(400).json({ message: "characters must be an array" });
    }

    if (characters.length !== 2) {
      return res
        .status(400)
        .json({ message: "Exactly 2 characters are required" });
    }

    // ✅ Validate each character + avatar url
    for (let i = 0; i < characters.length; i++) {
      const c = characters[i];

      if (!c?.name || !c?.description) {
        return res.status(400).json({
          message: `Character ${i + 1} must have name and description`,
        });
      }

      if (typeof c?.isVerified !== "boolean") {
        return res.status(400).json({
          message: `Character ${i + 1} must have isVerified boolean`,
        });
      }

      if (!Array.isArray(c?.titles) || c.titles.length === 0) {
        return res.status(400).json({
          message: `Character ${i + 1} must have titles array`,
        });
      }

      // ✅ avatar validations
      if (!c?.avatar?.url || !c?.avatar?.publicId) {
        return res.status(400).json({
          message: `Character ${i + 1} must have avatar.url and avatar.publicId`,
        });
      }

      if (
        c.avatar?.url &&
        !c.avatar.url.startsWith("https://res.cloudinary.com")
      ) {
        return res.status(400).json({
          message: `Invalid Cloudinary avatar URL for character ${i + 1}`,
        });
      }
    }

    // ✅ find existing hero
    let hero = await Hero.findOne({});

    // if hero doesn't exist yet → create directly
    if (!hero) {
      hero = await Hero.create({ characters });
      return res.status(201).json(hero);
    }

    // ✅ delete old avatar if changed
    for (let i = 0; i < characters.length; i++) {
      const newAvatar = characters[i]?.avatar;
      const oldAvatar = hero.characters?.[i]?.avatar;

      if (
        newAvatar?.publicId &&
        oldAvatar?.publicId &&
        newAvatar.publicId !== oldAvatar.publicId
      ) {
        await deleteFromCloudinary(oldAvatar.publicId);
      }
    }

    // ✅ update hero
    hero.set("characters", characters);
    await hero.save();

    return res.status(200).json(hero);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update hero data" });
  }
};
