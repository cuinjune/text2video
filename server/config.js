require("dotenv").config();
module.exports = {
  PORT: process.env.PORT || 8000,
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  PIXABAY_API_AUTH_KEY: process.env.PIXABAY_API_AUTH_KEY || ""
}