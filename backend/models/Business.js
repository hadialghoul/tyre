const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: String,
  phone: {
    type: String,
    required: true
  },
  alternatePhone: String,
  email: String,
  address: String,
  website: String,
  logo: String,
  logo2: String,
  secondName: String,
  images: [String],
  openingHours: String,
  coverImage: String,
  starRating: {
    type: Number,
    min: 0,
    max: 5
  },
  serviceType: String,
  mapsUrl: String,
  hasDelivery: Boolean,
  deliveryPhone: String,
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    stars: { type: Number, min: 1, max: 5 },
    name: String,
    visitorId: String,
    createdAt: Date,
    updatedAt: Date
  }],
  latitude: Number,
  longitude: Number,
  featured: {
    type: Boolean,
    default: false
  },
  menus: [{
    name: String,
    description: String,
    type: {
      type: String,
      enum: ['image', 'link'],
      default: 'image'
    },
    link: String,
    image: String,
    items: [{
      name: String,
      description: String,
      price: Number,
      image: String
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Business', businessSchema);
