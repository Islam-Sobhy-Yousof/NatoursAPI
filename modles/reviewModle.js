/**
 * review => string
 * rating => number
 * created at : date
 * ref user
 * ref tour
 */
const Tour = require('../modles/tourModle')
const AppError = require('../utils/appError')
const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review must have a content'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'tour must have a review rating'],
      default: 4.5,
      min: [1, 'Review Rating Can not be less than 1'],
      max: [5, 'Review Rating Can not be greater than 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to an author'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//=============================================================================//

/**
 * Indexes
 */

//Compound index to ensure that the user can't review the same tour
reviewSchema.index({tour: 1,user : 1},{unique: true});
//=============================================================================//

/**
 * NOTE
 *We want to calculate the average rating and number of ratings each time a new review is
 * created,delted,updated => update rating
 */
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //NOTE at static method THIS keyword points to the current Modle


  /**
   * if the collection was empty i mean the reviews collection or
   * if match at aggregation was not matching anything  
   * then you will be aggregating on nothing which will make the stats vaiable
   * to be undefined and this will make troubles you should take care off
   */
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRatings: { $avg: '$rating' },
      },
    },
  ]);
  /**
   * Check wheather the current aggregated document is the last one or not
   * if it was the last one and you delete it then you will call aggregate on undefined
   * so you should make the rating Quantity to 0 and average to anything 0 | 4.5
   * 
   * NOTE => the stats will be undefined if you are trying to delete the document
   * so you have to use ? nullish calusing operator [don't even kow how to spell it]
   */
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0]?.avgRatings || 4.5,
    ratingsQuantity: stats[0]?.nRatings || 0
  });
};



//==============================================================================//

/**
 * Document middle wares
 */
reviewSchema.post('save', function () {
  /**
   * NOTE at this middleware THIS keyword refers to the current document
   * But we want to use the static method that we do constructed before HOW?
   * this referse to the current doc and this.constructor refers to it's parent
   * which is the modle
   */
  this.constructor.calcAverageRatings(this.tour);
  
});


//===============================================================================//
/**
 * Query Middlewares
 */

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});


reviewSchema.post(/^findOneAnd/, async function (doc) {
  /**
   * Here doc is the current document that has the content of the query after executing it
   * so you can use it or actually use it's parent which is the modle at this case
   * and do what you want at it
   * 
   * And if you delted the document by using findByIdAndDelete the doc will be the delted one
   */
  if(doc){
    await doc.constructor.calcAverageRatings(doc.tour);
  }
  
});
//==========================================================================
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
