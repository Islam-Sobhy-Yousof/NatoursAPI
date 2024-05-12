const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoute');
//routes
const router = express.Router();
/**
 * Nested routes
 */
router.use('/:tourId/reviews', reviewRouter);

/**
 * Special routes
 */
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.get('/tours-within/:distance/center/:latlng/unit/:unit',tourController.getToursWithin);
router.get('/distances/:latlng/unit/:unit',tourController.getDistances)
/**
 * General routes
 * 
 *  */  
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide','guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
