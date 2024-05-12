class APIFeatures {
  //queryString => is the route itself
  //query => is the query object from the Tour.find()
  constructor(queryString, query) {
    this.queryString = queryString;
    this.query = query;
  }
  filter() {
    const queryObject = { ...this.queryString };
    const execludedFields = ['sort', 'limit', 'fields', 'page'];
    execludedFields.forEach((ele) => delete queryObject[ele]);
    let queryStr = JSON.stringify(queryObject);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`),
    );
    this.query = this.query.find(queryStr);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('price');
    }
    return this;
  }
  limit() {
    if (this.queryString.fields) {
      const fieldsNames = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldsNames);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  pagenate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skipBy = (page - 1) * limit;
    this.query = this.query.skip(skipBy).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;