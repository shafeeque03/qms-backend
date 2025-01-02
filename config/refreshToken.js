export const refreshToken = async (req, res) => {
  const { role } = req.body;  // Ensure that the role is passed from the frontend
  let refreshToken = req.cookies[`${role}RefreshToken`];  // Role-specific cookie

  if (!refreshToken) {
    return res.status(401).json("You're not authenticated");
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json("Invalid refresh token");

    // Generate new tokens for the role
    const newAccessToken = jwt.sign(
      { id: user.id },
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: '7d' }
    );

    // Update role-specific refresh token in cookies
    res.cookie(`${role}RefreshToken`, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
};
