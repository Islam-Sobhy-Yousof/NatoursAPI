const AppError = require('../utils/appError');
const Tour = require('./../modles/tourModle');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('../controllers/handlerFactory');
//routes controler

/**
 * General controllers
 */
exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTour = handlerFactory.getOne(Tour, { path: 'reviews' });
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

//============================================================================//

/**
 * Geospatial Controllers
 */

// /tours-within/222/center/34.111745,-118.113491/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latidute and longtude in this formate lat,lng',
        400
      )
    );
  }

  /**
   * to get the geoWithin data we should calc the radius of the sphere we are looking within
   * and to do so we should make the raduis of that sphere related to earth raduis
   * and to do so we have to divide by these numbers according to the unit if it was with
   * miles => 3963.2 or km => 6378.1
   */
  const raduis = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], raduis],
      },
    },
  });
  res.status(200).json({
    status: 'success',
    resultsCount: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  /**
   * Here is what this should do
   * get the the needed informations from here : /distances/:latlng/unit/:unit
   * Get lat,lng and the unit
   * after this you want to make aggregation on each tour documents to calc
   * the distance from this point to this tour
   */
  const {latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'km' ? 1 / 1000 : 1 / 1609.34;

  /**
   * NOTE geoNear requires the folowing
   * to be the first stage at the aggregation pipeline
   * to be at least on index at one of the fields you aggregates on
   */
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        spherical: true,
        distanceMultiplier : multiplier
      },
    },
    {
      $project: {
        name: 1,
        distance:1,
        _id: 0,
      },
    },
    {
      $addFields:{
        distance: {
          $round: ['$distance',2]
        }
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
//============================================================================//
/**
 * Alias middle ware for getting the cheapest five tours
 */
exports.aliasTopTours = catchAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
});
/**
 * Special Controllers
 */
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrcie: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1, //for asc
      },
    },
  ]);
  res.status(200).json({
    status: 'succes',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      /**
       * this is like loop over every document and do this
       * if the property startDates has more than one value
       * make a new document for each value
       * newDocs = [
       * doc-1-v1,
       *doc-1-v2,
       *doc-2-v1,
       *doc-2-v2,
       * doc-2-v3
       * ]
       */
      $unwind: '$startDates',
    },
    {
      $match: {
        /**
         * this is like loop over every document
         * if startDAtes meet this conditon
         * between new Date(`${year}-01-01` and new Date(`${year}-12-31`
         * make [
         * document-1,
         * document-2,
         * document-3,
         * etc...
         * ]
         */
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        /**
         * this is like loop over every document
         * if the _id property is not visited
         * add it to gropus array
         * and add the next properties to it
         * [
         * 21-10-2024 : {
         * numberTourStarts : 5,
         * tourName: [name-one,name-two],
         * },
         *  25-7-2024 : {
         * numberTourStarts : 3,
         * tourName: [name-one,name-two,name-three],
         * }
         * ]
         */
        _id: { $month: '$startDates' },
        numberTourStarts: { $sum: 1 },
        tourName: { $push: '$name' },
      },
    },
    {
      $addFields: {
        /**
         * it means loop over the output docuemnt from previous stages
         * for each document add this field _id
         * _id in the output document is month not the actual id
         */
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numberTourStarts: -1,
      },
    },
    {
      $limit: 55,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
