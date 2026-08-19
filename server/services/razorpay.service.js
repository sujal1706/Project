import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

console.log(
  "RAZORPAY_KEY_ID:",
  process.env.RAZORPAY_KEY_ID
    ? "PRESENT"
    : "MISSING"
);

console.log(
  "RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET
    ? "PRESENT"
    : "MISSING"
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;