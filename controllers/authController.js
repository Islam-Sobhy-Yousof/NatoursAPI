const catchAsync = require('./../utils/catchAsync');
const User = require('./../modles/userModle');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //the coockie will only be sent on an incrypted connection ONLY(HTTPS)
    httpOnly: true, //the cookie can't be modified by the browser to prevent(XSS)
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('token', token,cookieOptions);
  //to hide the password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    // passwordChangedAt: req.body.passwordChangedAt,
  };
  const user = await User.create(data);
  createSendToken(user, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  const isValidPass =
    user && (await user.correctPassword(password, user.password));
  if (!user || !isValidPass) {
    return next(new AppError('Invalid email or password', 401));
  }
  //Sending the token to the client
  createSendToken(user, 200, res);
});
exports.protect = catchAsync(async (req, res, next) => {
  //1) Check if the token exists
  let token;
  const isAuth = req.headers.authorization;
  const hasToken = isAuth && isAuth.startsWith('Bearer');
  if (isAuth && hasToken) {
    //take the toke from the Bearer string which is something like that
    //bearer => type of token ey$22i308kgfQwe => token
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }
  //2) Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) make sure the user already exists and did not delete the account
  /**
   * this means the scenario
   * suppose the user has logged in => this means there is a valid token for him
   * suppose the user deleted this account => the token is exists and still valid
   * we've to prevent this from hapening
   * because if the user is deleted his token should be deleted also
   */
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The user belonging to this token is no longer exists', 401)
    );
  }

  //4) Check if the user changed his password after the token is issued
  //this means the user logged in and changed his password j
  //and now he is trying to go to his setting or reload the page
  //so he have to reloing to can do this
  const isPassChanged = user.changedPasswordAfter(decoded.iat);
  if (isPassChanged) {
    return next(
      new AppError('The user password has been changed please login again', 401)
    );
  }

  //to the next stage
  req.user = user;
  next();
});

//Restrict to function

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    //you've to see if the role if the current user is in roles array

    const userRole = req.user.role;
    const hasRole = roles.some((ele) => ele === userRole);
    if (!hasRole) {
      return next(
        new AppError(
          `You don't have the permission for doing this action`,
          403
        )
      );
    }
    next();
  });
};
/**
 * here we just recieve the email of the user
 * verify it this email already exists
 * if it was we send random token to the user to reset his password
 */

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1) Get the user based on his POST email
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }
  //2) Generating the random token using crypto
  const resetToken = user.createPasswordResetToken().toString('decimal');

  //we save the document to make sure the changes at createPasswordResetToken was saved
  await user.save({ validateBeforeSave: false });
  // 3) Send this token using email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forget your password? Sumbit a patch request with
   your new password and passwordConfirm to ${resetURL}\n
   If not please ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token (valid for 10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'succes',
      message: 'token was send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending email. Please try again later',
        500
      )
    );
  }

  // next();
});
/**
 * at this the user sends his new pass with the token generated from the forgetPass handler
 * if the token was valid then we change the user's password
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on the token
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2)if the token has not expired and the user exists, set the new password
  if (!user) {
    return next(new AppError('The token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //we do this (user.save) to apply the changes that happens at the pre middleware
  //and the above changes e.g => user.confirmPassword = undefiend

  await user.save();
  //4)log the user in ,set the JWT
  createSendToken(user, 200, res);

  //this response will be consumed as a promise and the token will be taken from it
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection

  const id = req.user.id;
  const user = await User.findById(id).select('+password');

  /**
   * you will recieve the next
   * the user current password
   * the user new password
   * the user confirm new password
   */

  //2)check if the current POSTED password is correct
  const passwordCurrent = req.body.passwordCurrent;
  const isCorrectPassword = await user.correctPassword(
    passwordCurrent,
    user.password
  );
  if (!isCorrectPassword) {
    return next(
      new AppError(
        'Current password is not true please enter valid password',
        401
      )
    );
  }

  //3)if so, update the password

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  //4)Log the user in by sending the JWT
  createSendToken(user, 200, res);
});
