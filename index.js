const { URLSearchParams } = require('url');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const mongoose = require('mongoose');
const { saveNumberAndFBID, getStoredNumbers } = require('./mongodb');

require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(error => {
  console.error('Failed to connect to MongoDB', error);
});

app.get('/query', async (req, res) => {
  try {
    const numberToQuery = req.query.number || '';

    const items = await getStoredNumbers(numberToQuery);

    res.json({ numberToQuery, items });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/api/numbers', async (req, res) => {
  try {
    const { number, fbid } = req.body;

    console.log('Received number:', number, 'FBID:', fbid);

    await saveNumberAndFBID(number, fbid);

    res.status(200).json({ message: 'Number and FBID received' });

    io.emit('newNumber', { number, fbid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/numbers', async (req, res) => {
  try {
    const items = await getStoredNumbers();

    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.post('/subscribe', async (req, res) => {
  try {
    const { fbid, subscriptionStatus } = req.body;

    const payload = {
      fbid,
      subscriptionStatus
    };

    const response = await axios.post('http://brow.ntrsoa.repl.co/subscribe', new URLSearchParams(payload));

    const responseData = response.data;

    res.json(responseData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/send_message', async (req, res) => {
  try {
    const { fbid } = req.body;

    if (!fbid) {
      res.status(400).json({ error: 'Missing required parameter: fbid' });
      return;
    }

    const payload = {
      fbid
    };

    const response = await axios.post('http://self.ntrsoa.repl.co/send_message', new URLSearchParams(payload));

    const responseData = response.data;
    res.json(responseData);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/', (req, res) => {
  res.render('form', { numberToQuery: '' });
});

const port = 3000;
const server = http.createServer(app);
const io = socketIO(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
