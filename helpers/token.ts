import jwt from "jsonwebtoken";

export const createTokens = (user: any) => {
    const access_token = jwt.sign(
        { email: user.email, username: user.username, role:user.role},
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "15m"}
    );

    const refresh_token = jwt.sign(
        { userId: user._id, email: user.email},
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "7d"}
    );

    return { access_token, refresh_token}
}