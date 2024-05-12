module.exports = (fn) => {
  return function(req, res, next){
    /**
     * by saying catch(next)
     * the error which the catch block catches will be passed to next function
     * and next function will stop middleware stack
     * look for the nearest error handling middleware and run it
     */
    fn(req, res, next).catch(next);
  };
};
