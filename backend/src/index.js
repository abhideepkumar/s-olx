import { app } from "./app.js";
import connectDb from "./db.js";

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("App started at port: ", process.env.PORT);
    });
  })
  .catch(() => {
    console.log("Error in connecting to database");
  });
