const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
exports.deleteOne = (Modle) => {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Modle.findByIdAndDelete(id);
    if (!doc) {
      return next(new AppError('No Document Matches This ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

//========================================================================//

exports.updateOne = (Modle) => {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Modle.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if(!doc){
        return next(new AppError('No document found with this ID',404))
    }
    res.status(200).json({
      status: 'success',
      data: {
        data:doc,
      },
    });
  });
};

//=====================================================================//
exports.createOne = (Modle) => catchAsync(async (req, res, next) => {
  const doc = await Modle.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

//============================================================================//
exports.getOne = (Modle,populationOptions) => catchAsync(async (req, res, next) => {
  //also you can add some optional params like this
  ///api/v1/tours/:id/:name? => ? makes the param optional
  const id = req.params.id;
  // const tour = await Tour.findOne({_id: id},{name: 1});
  let query = Modle.findById(id);
  if(populationOptions){
    query.populate(populationOptions);
  }
  const doc = await query;
  if (!doc) {
    return next(new AppError('No documnet Found Matches This ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});


//===============================================================//

exports.getAll = (Modle) =>  catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  const features = new APIFeatures(req.query, Modle.find(filter))
    .filter()
    .sort()
    .limit()
    .pagenate();
  /**
   * query here is the value of the query made by the objecct features
   * since he is an object so we have to get the value from it like this 🐲
   * 
   * Note we did not populated our reviews on tours because we simply don't want 🐕
   */
  const doc = await features.query;
  res.status(200).json({
    status: 'succes',
    resultsCount: doc.length,
    data: {
      data: doc,
    },
  });
});

