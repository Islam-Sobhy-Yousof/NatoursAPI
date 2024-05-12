const catchAsync = require('../utils/catchAsync');
const Review = require('../modles/reviewModle');
const AppError = require('../utils/appError');
const handlerFactory = require('../controllers/handlerFactory');

exports.getAllReviews = handlerFactory.getAll(Review);

exports.getReview = handlerFactory.getOne(Review);
exports.setTourUserIds = (req, res, next) => {
  req.body.tour = req.body.tour || req.params.tourId;
  req.body.user = req.body.user || req.user.id;
  next();
};
exports.createReview = handlerFactory.createOne(Review);

//This is for admin only
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
