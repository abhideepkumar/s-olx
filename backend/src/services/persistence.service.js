import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chat } from '../models/chat.model.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the persistence file
const PERSISTENCE_FILE = path.join(__dirname, '../../data/messages.jsonl');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(PERSISTENCE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize data directory
ensureDataDirectory();

class PersistenceService {
  constructor() {
    this.isProcessing = false;
    this.startBatchProcessor();
  }

  // Store message to disk immediately
  async storeMessage(messageData) {
    try {
      // Generate unique messageId if not provided
      if (!messageData.messageId) {
        messageData.messageId = uuidv4();
      }

      // Add timestamp if not provided
      if (!messageData.timestamp) {
        messageData.timestamp = new Date();
      }

      // Convert to JSON string and append to file
      const jsonLine = JSON.stringify(messageData) + '\n';
      
      // Append to file synchronously for immediate persistence
      fs.appendFileSync(PERSISTENCE_FILE, jsonLine, 'utf8');
      
      console.log(`Message stored to disk: ${messageData.messageId}`);
      return messageData;
    } catch (error) {
      console.error('Error storing message to disk:', error);
      throw error;
    }
  }

  // Process all messages from file and push to database
  async processBatchToDatabase() {
    if (this.isProcessing) {
      console.log('Batch processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Check if file exists
      if (!fs.existsSync(PERSISTENCE_FILE)) {
        console.log('No persistence file found, nothing to process');
        return;
      }

      // Read all lines from file
      const fileContent = fs.readFileSync(PERSISTENCE_FILE, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        console.log('No messages to process');
        return;
      }

      console.log(`Processing ${lines.length} messages from disk to database...`);

      // Parse JSON lines
      const messages = [];
      const invalidLines = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const message = JSON.parse(lines[i]);
          messages.push(message);
        } catch (error) {
          console.error(`Invalid JSON on line ${i + 1}:`, lines[i]);
          invalidLines.push(i);
        }
      }

      if (messages.length === 0) {
        console.log('No valid messages to process');
        return;
      }

      // Insert messages to database
      const result = await chat.insertMany(messages, { ordered: false });
      console.log(`Successfully inserted ${result.length} messages to database`);

      // Create new file content without processed messages
      const remainingLines = lines.filter((_, index) => !invalidLines.includes(index) && 
        !messages.some(msg => JSON.stringify(msg) === lines[index]));

      if (remainingLines.length > 0) {
        // Write remaining lines back to file
        fs.writeFileSync(PERSISTENCE_FILE, remainingLines.join('\n') + '\n', 'utf8');
        console.log(`${remainingLines.length} messages remain in persistence file`);
      } else {
        // Remove file if all messages processed successfully
        fs.unlinkSync(PERSISTENCE_FILE);
        console.log('All messages processed, persistence file removed');
      }

    } catch (error) {
      console.error('Error processing batch to database:', error);
      
      // If database operation failed, keep the file intact
      // This ensures no data loss
    } finally {
      this.isProcessing = false;
    }
  }

  // Start the batch processor with 15-minute intervals
  startBatchProcessor() {
    console.log('Starting persistence batch processor (15-minute intervals)');
    
    // Process immediately on startup
    this.processBatchToDatabase();

    // Set up interval for every 15 minutes
    setInterval(() => {
      console.log('Running scheduled batch processing...');
      this.processBatchToDatabase();
    }, 15 * 60 * 1000); // 15 minutes in milliseconds
  }

  // Manual trigger for batch processing (useful for testing)
  async triggerBatchProcessing() {
    console.log('Manual batch processing triggered');
    await this.processBatchToDatabase();
  }

  // Get pending message count
  getPendingMessageCount() {
    try {
      if (!fs.existsSync(PERSISTENCE_FILE)) {
        return 0;
      }

      const fileContent = fs.readFileSync(PERSISTENCE_FILE, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      return lines.length;
    } catch (error) {
      console.error('Error getting pending message count:', error);
      return 0;
    }
  }

  // Get pending messages (for debugging)
  getPendingMessages() {
    try {
      if (!fs.existsSync(PERSISTENCE_FILE)) {
        return [];
      }

      const fileContent = fs.readFileSync(PERSISTENCE_FILE, 'utf8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      }).filter(msg => msg !== null);
    } catch (error) {
      console.error('Error getting pending messages:', error);
      return [];
    }
  }
}

// Create singleton instance
const persistenceService = new PersistenceService();

export default persistenceService;
