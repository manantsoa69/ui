require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('mongoose');
const { Types } = mongoose;

const itemSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    number: String,
    fbid: String,
    receivedate: String,
  },
  { _id: false }
);

const Item = mongoose.model('Item', itemSchema);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });

// Rest of the code...

async function saveNumberAndFBID(number, fbid) {
  try {
    const madagascarOptions = { timeZone: 'Indian/Antananarivo' };
    const currentDate = new Date().toLocaleString('en-fr', madagascarOptions);

    const existingItem = await Item.findOne({ fbid }); // Check if an entry with the same fbid exists

    if (existingItem) {
      // Update the existing entry
      existingItem.number = number;
      existingItem.receivedate = currentDate;
      await existingItem.save();
    } else {
      // Create a new entry
      const item = new Item({
        _id: new mongoose.Types.ObjectId(),
        number: number,
        fbid: fbid,
        receivedate: currentDate,
      });

      await item.save();
    }
  } catch (error) {
    console.error('Error saving number and FBID:', error);
    throw error;
  }
}

async function getStoredNumbers(number) {
  try {
    let query = {};

    if (number) {
      query.number = number;
    }

    const items = await Item.find(query).select('-_id number fbid receivedate').lean(); // Exclude the _id field

    return items;
  } catch (error) {
    console.error('Error getting stored numbers:', error);
    throw error;
  }
}

module.exports = {
  saveNumberAndFBID,
  getStoredNumbers,
};
