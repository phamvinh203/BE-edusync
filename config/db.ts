import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

export const connect = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log("connect success");
  } catch (error) {
    console.log("connect error");
  }
};

// Kết nối Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);
