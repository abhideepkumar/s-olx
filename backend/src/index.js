import { app } from "./app.js";
import connectDb from "./db.js";
import socketService from "./services/socket.service.js";
import messageBatchService from "./services/message-batch.service.js";
import messagePersistenceEnhancedService from "./services/message-persistence-enhanced.service.js";
import { createServer } from "http";

connectDb()
  .then(async () => {
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize services
    await messagePersistenceEnhancedService.initialize();
    await messageBatchService.initialize();
    
    // Initialize Socket.IO
    socketService.initialize(server);
    
    // Start server
    server.listen(process.env.PORT || 8000, () => {
      console.log("App started at port: ", process.env.PORT);
      console.log("Socket.IO server ready for connections");
      console.log("Message batch service initialized");
      console.log("Enhanced persistence service initialized");
    });
  })
  .catch((error) => {
    console.log("Error in connecting to database:", error);
  });
