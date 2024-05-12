/*
- mongo is about the models and models is the blue print for documents
- you can use these models to build multiple documents with some shape
- you can say modles like a class in OOP 
- to create a modle you have to first create a schema 
  - we use schema to descripe our data 
  - set default values 
  - validate data
- NOTE 
  - the model is a wrapper for the shema
*/
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//Creating new schema

const tourSchema = new mongoose.Schema(
  {
    //we can specify schema type opject
    //to make some fields more specific
    name: {
      type: String,
      required: [true, 'A tour Must have a Name'], //it's called a validator
      //its a message appears when there is an error about this field
      unique: true,
      trim: true,
      maxlength: [40, 'A Tour Name must Be At Most  40 characters'],
      minlength: [1, 'A Tour Name must Be At Leaset 1 characters'],
      // validate:{
      //   validator: validator.isAlpha,
      //   message: 'The tour name must be an alphabitical name'
      // }
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour Must have a Duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour Must have a Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour Must have a Difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, mdium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating Average must be greater than or equal 1.0'],
      max: [5, 'rating Average must be less than or equal 5.0'],
      set: (val) => {
        return Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour Must have a Price'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          //this keyword here refers to the the current document when creating a new one
          //not when updating an existing document
          return val <= this.price;
        },
        message: 'Discount MUST be less than or equla to Price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour Must have a Summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour Must have a ImageCover'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(), // monog will handel this to convert it to the current date
      select: false,
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: ['Point'],
          message: `Location values can't be anything But Point`,
        },
      },
      coordinates: {
        type: [Number],
      },
      address: {
        type: String,
      },
      description: {
        type: String,
      },
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: {
            values: ['Point'],
            message: `Location values can't be anything But Point`,
          },
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    /**
     * here we reference to the guides who are [Users] at the tour schema
     * the embeded version is no the best solution here but you cann apply it
     * using something like this
     * guides: Array
     * and after this when you add a tour you specify the users you want to put
     * after this you use a pre save middleware to add the users based on thier id
     * but this is SUCK
     */
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//=============================================================================//
/**
 * virtual properties
 */
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//=============================================================================//
/**
 * NOTE
 * Adding indexes to out db
 * indexing in db is to sort some fields value in an asc or desc order
 * so that if you query a document with this field or a punch of documents
 * you can find them faster because they are sorted
 */

//Single key index
// tourSchema.index({price: 1})
//multiple key index
tourSchema.index({price: 1,ratingsAverage: -1})
tourSchema.index({slug : 1})
tourSchema.index({startLocation: '2dsphere'})
//=============================================================================//

/**
 * Virtual populating
 * it's simply adding a virtual field to the schema 
 * this virtual field fetches it's data from other schem
 * but it should know two things
 * the foreignField => at the modle you want to retrieve data from
 * the localField => at the modle you want to add the virtual property at
 */
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//=============================================================================//
/**
 * Document Middleware: runs before save | create => (event,callBack function)
 */

tourSchema.pre('save', function (next) {
  //this => is the newly created document or saved one
  // this.slug = slugify(this.name,{lower:true});
  next();
});

//middleWare that works after the document is saved
tourSchema.post('save', function (doc, next) {
  //console.log(doc);
  next();
});

//=============================================================================//
/**
 * Query MiddleWare
 */

//pre middleWare

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
tourSchema.pre(/^find/, function (next) {
  /**
   * this represents the query object itself
   * which you create when you use `await Tour`
   * Tour here became a query object when you
   * used find on it so it will return inot query object
   */
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();

  next();
});

//post middleWare
tourSchema.post(/^find/, function (doc, next) {
  console.log(`The Query Took ${Date.now() - this.startTime} MS`);

  next();
});

//=============================================================================//

/**
 * aggregation MiddleWares
 */
tourSchema.pre('aggregate', function (next) {
  // console.log(this);
  // this.pipeline().unshift({
  //   $match: { secretTour: { $ne: true } },
  // });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
