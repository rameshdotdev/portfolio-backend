// controllers/Message.controller.ts
import type { Request, Response } from "express";
import Message from "../models/Message.model.js";

export const submitMessage = async (req: Request, res: Response) => {
  await Message.create(req.body);
  res.status(201).json({ message: "Message sent successfully" });
};

export const getMessages = async (_: Request, res: Response) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
};

export const markAsRead = async (req: Request, res: Response) => {
  await Message.findByIdAndUpdate(req.params.id, { isRead: true });
  res.status(200).send();
};
