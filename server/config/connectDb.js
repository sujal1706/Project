import mongoose from "mongoose";

const connectDb = async () => {
    try {
        console.log("MongoDB URL exists:", !!process.env.MONGODB_URL);

        console.log(
            "MongoDB Host:",
            process.env.MONGODB_URL?.split("@")[1]?.split("/")[0]
        );

        await mongoose.connect(process.env.MONGODB_URL);

        console.log("DataBase Connected");
    } catch (error) {
        console.log("DataBase Error:", error.message);
    }
};

export default connectDb;