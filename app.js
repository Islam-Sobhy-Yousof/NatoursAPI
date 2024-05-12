const express = require('express');
//Third party middlewares
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser');
//App Controllers
const tourRouter = require('./routes/tourRoute');
const usersrRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute')
const globaleErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const app = express();

//Set security HTTP Headers
app.use(helmet())
//Reading data from the body into req.body
app.use(express.json());

//Sanitize No.SQL injection
app.use(mongoSanitize())

//Sanitize Xss
app.use(xss())

//Sanitize Query Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//using morgan middleware which act as a nice formater for our request
//it log to the terminal some data about your request like this
//GET => http method /api/v1/tours => route path 200=> status code 3.215 ms => time - 8807=>size of the res in bytes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
/**
 * we created a middleware using the rateLimit function from express-rate-limit package
 * we pass some options telling him here
 * make the maximum requests 100 request per hour
 * 100 req/H
 */

//Limit Requests from a certain IP
const limiter = rateLimit({
  max:100,
  windowMS:60*60*1000,
  message:'Too Many Requests Tray again after 1H'
})

//use the middleware you've just created
app.use(limiter)
app.use(express.static(`${__dirname}/public`));

//Parse the cookies and add cookie
app.use(cookieParser());

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersrRouter);
app.use('/api/v1/reviews', reviewRouter);

/**
 * Thsi route use (all method) which specify the type of request to
 * all types [get,post,delete,put,patch]
 * (*) matches every route no matter what is it
 * This route is for all any other route that will pass the above two routes
 * it will do only one thing which is make next function throw a globale error
 * this error will be created using the AppError class
 */
app.all('*', (req, res, next) => {
  /**
   * next callback is used for moving to next middleware
   * next accepts three parameters
   *  - emtpy parameter
   *    - means move to next middleware
   *  - error parameter
   *    - stop middleware stack and
   */
  next(new AppError('The API does not have this Route', 404));
});

//this is the globale middleware
app.use(globaleErrorHandler);
module.exports = app;
