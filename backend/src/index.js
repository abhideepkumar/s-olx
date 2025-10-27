import { app } from "./app.js";
import connectDb from "./db.js";
import SocketService from "./services/socket.service.js";

connectDb()
  .then(() => {
    // Initialize Socket.IO service
    const socketService = new SocketService(app);
    const server = socketService.getServer();
    
    server.listen(process.env.PORT || 8000, () => {
      console.log("App started at port: ", process.env.PORT);
      console.log("Socket.IO server initialized");
    });
  })
  .catch(() => {
    console.log("Error in connecting to database");
  });
