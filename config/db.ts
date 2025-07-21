import mongoose from "mongoose";
// import { createClient, SupabaseClient } from "@supabase/supabase-js";

// connect mongodb
export const connect = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log('connect success');
  } catch (error) {
    console.log('connect error');
  }
};

// connect supabase
// Kết nối Supabase
// export const supabase: SupabaseClient = createClient(
//   process.env.SUPABASE_URL as string,
//   process.env.SUPABASE_ANON_KEY as string
// );