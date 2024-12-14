import jwt from 'jsonwebtoken';

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
console.log(refreshToken,"will laways call you")
  if (!refreshToken) return res.status(401).json("You're not authenticated");

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json("Invalid refresh token");

    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
};
