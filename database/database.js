import mongoose from "mongoose";

export const connectDB = (uri) => {
  mongoose
    .connect(uri, {
      dbName: "Femcatel",
    })
    .then((c) => console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};
