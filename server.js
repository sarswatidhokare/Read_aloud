const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection URL
const mongoURL = 'mongodb://localhost:27017'; // Update with your MongoDB connection string

// Database Name
const dbName = 'textToSpeech'; // Update with your database name

// Start the server
const port = process.env.PORT || 4000;
async function startServer() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(mongoURL);
    await client.connect();

    console.log(`Connected to MongoDB at ${mongoURL}`);

    // Set up routes after successful MongoDB connection
    const db = client.db(dbName);

    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.post('/saveText', async (req, res) => {
      const textToSave = req.body.text;
      console.log('Text received:', textToSave);
      try {
        // Insert the text into the MongoDB collection
        const result = await db.collection('savedText').insertOne({ text: textToSave });
        console.log('Text saved to database:', result.ops);

        res.redirect('/'); // Redirect to the main page after saving
      } catch (error) {
        console.error('Error saving text to MongoDB:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.get('/displayText', async (req, res) => {
      try {
        // Retrieve all saved text from the MongoDB collection
        const savedText = await db.collection('savedText').find().toArray();
        res.json(savedText);
      } catch (error) {
        console.error('Error retrieving text from MongoDB:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

    // Close MongoDB connection when the server is stopped
    process.on('SIGINT', async () => {
      await client.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

startServer();
