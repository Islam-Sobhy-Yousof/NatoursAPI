const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
const handleJWTError = (error) => {
  return new AppError('Invalid token. Please Log in Again', 401);
};
const handleJWTExpiredError = (error) => {
  return new AppError('Your token has been expired! Please Log in again',401  )
}
const handelCastErrorDB = (error) => {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldDB = (error) => {
  //Regex for catching the values inside quotes
  const value = error.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate Field value: ${value.slice(1,-1)} Use another value`;
  return new AppError(message, 400);
};
const handleValidationError = (error) => {
  const errorMessges = Object.values(error.errors).map((ele) => {
    return ele.message;
  });
  const message = `Invalid Input Fields: ${errorMessges.join(', ')}`;
  return new AppError(message, 400);
};
const sendErrorProd = (err, res) => {
  
  if (!err.isOperational) {
    /**
     * Please note this
     * there are three types of erros mongo might throw
     * and because these errors has no isOpeartional value
     * this mean the error handler will regaurd them non operational
     * and will give the user the message of `something went wrong`
     * where we shold send another message tell the user what has happend wrong
     * these mongo erros is
     *  - search by NOT valid ID => Casting error
     *  - create duplicate entry at the db => duplication error
     *  - validation erros thrown by the validators at the schema 
     * and there are some other errors that other things might throw
     *  - JWT token errors
     */
    console.error('Error 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong :(',
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'err';
  if (process.env.NODE_ENV == 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV == 'production') {
    let error = { ...err, name: err.name,message: err.message };
    if (error.name === 'CastError') {
      error = handelCastErrorDB(error);
    } else if (error.code === 11000) {
      //this means that there is a duplication error
      error = handleDuplicateFieldDB(error);
    } else if (error.name == 'ValidationError') {
      
      error = handleValidationError(error);
    }else if (error.name === 'JsonWebTokenError'){
      error = handleJWTError(error);
    }else if (error.name === 'TokenExpiredError'){
     
      error = handleJWTExpiredError(error);
    }
    sendErrorProd(error, res);
  }
  // next();
};
