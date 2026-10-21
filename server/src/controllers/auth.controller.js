import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../services/auth.service.js";

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await registerUser(email, password);

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: user.user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser(email, password);

    res.cookie("token", result.token, getCookieOptions());

    return res.status(200).json({
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  res.clearCookie("token", getCookieOptions());

  return res.status(200).json({
    message: "Logged out successfully",
  });
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);

    if (!user) {
      res.clearCookie("token", getCookieOptions());

      return res.status(401).json({
        message: "User account no longer exists",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
