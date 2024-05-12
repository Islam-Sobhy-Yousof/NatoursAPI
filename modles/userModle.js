const mongoose = require('mongoose');
const validator = require('validator');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
//name,email,photo,password,passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a user name'],
    maxlength: [50, 'A user name can not be more than 20 chars'],
    minlength: [1, 'A user name can not be less than 1 chars'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: [true, 'A user email have to be unique'],
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Email is not valid',
    },
  },
  photo: {
    type: String,
    trim: true,
    default: 'no photo',
  },
  role:{
    type:String,
    values: ['user','guide','lead-guide','admin'],
    message: 'The allwoed roles are between [user,guide,lead-guide,and admin]',
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    maxlength: [30, 'A user password can not be more than 30 chars'],
    minlength: [8, 'A user password can not be less than 8 chars'],
    select:false
  },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      //this only works on CREATE | SAVE!
      //NOTE WORKING ON UPDATE  so you've to workaround this
      validator: function (pass) {
        return pass === this.password;
      },
      message: 'Passwords do not match',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken:{
    type:String
  },
  passwordResetExpires:{
    type:Date
  },
  activeUser:{
    type:Boolean,
    default:true,
    select:false
  }
});

//====================================================================================//
//add some validation middlewares
userSchema.pre('save', async function (next) {
  /**
   * NOTE
   * This middleware will be executed only after the schema validation is done
   */
  //we wanna run this middleware if and only if the password is modified
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  //this indicates the confirm pass is not set into the DB
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save',function(next) {
  /**
   * we make sure that the user password is not modified
   * and the document is not newly created
   */
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  //we subtract 1000 to make sure this time is less than JWT token
  //because reading or writing to the db is slower than jwt token generation
  this.passwordChangedAt = Date.now() - 1000;
  next();
})

//====================================================================================//
userSchema.pre(/^find/,function(next){
  this.find({activeUser : {$ne : false}})
  next();
})
//====================================================================================//

//adding a function on the schema so that it can be used with all documents
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  //make a 32 random bytes and convert the value into them into hex
  const resetToken = crypto.randomBytes(32).toString('hex');

  //create hash with sha256 and put our 32 byte token into it then convert it to hex
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  //add the token to the data base
  this.passwordResetToken = passwordResetToken;
  //make the expire data after ten minutes 
  this.passwordResetExpires = Date.now() + (10 * 60 * 1000);
  
  return resetToken;
};

//====================================================================================//
const User = mongoose.model('User', userSchema);

module.exports = User;
