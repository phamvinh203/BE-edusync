import jwt from 'jsonwebtoken';

// xác thực token
export const decodeToken = (authHeader: string | undefined): any => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Thiếu token xác thực');
  }
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
};


// import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";

// interface JwtPayload extends DefaultJwtPayload {
//   email: string;
//   role: "admin" | "teacher" | "student";
// }

// export const decodeToken = (authHeader: string | undefined): JwtPayload => {
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     throw new Error("Thiếu token xác thực");
//   }

//   const token = authHeader.split(" ")[1];

//   if (!process.env.JWT_SECRET) {
//     throw new Error("JWT_SECRET chưa được cấu hình");
//   }

//   return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
// };
