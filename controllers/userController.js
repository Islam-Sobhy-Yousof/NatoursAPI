const User = require('../modles/userModle');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('../controllers/handlerFactory');
const filterBody = (bodyObject,...allowedFields) => {
  const filterd = {};
  Object.keys(bodyObject).forEach(ele => {
    if(allowedFields.includes(ele)){
      filterd[ele] = bodyObject[ele]
    }
  })
  return filterd;
}
exports.getMe = (req,res,next) => {

  req.params.id = req.user.id;
  next();
}
exports.updateMe = catchAsync(async (req, res, next) => {
  //we have to use this method to update the user email and name
  
  //1)get the user data [newEmail,newPassword]
  const { name, email } = req.body;
  //2)make sure the user and the email is not empty
  //the email must be unique be here it doesn't :<
  if (!name || !email) {
    return next(new AppError('You must set email and password'));
  }
  //3)get the updated user based on protect middleware
  const userId = req.user.id;
  //3)update the user with new data
  const filtered = filterBody(req.body,'email','name');
  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true, // telling mongo to return the newlly updated document
    runValidators: true, // to run the validators ON
  });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
exports.deleteMe = catchAsync(async(req,res,next) => {
  //1)get the user based on his login information
  const userId = req.user.id;
  const user = await User.findByIdAndUpdate({_id : userId},{activeUser: false});
  res.status(204).json({
    //empty response
    status:'success',
    data:null
  })
  
})
exports.getUser = handlerFactory.getOne(User)

exports.getAllUsers = handlerFactory.getAll(User)
//Don Not update password with this this handler is for Admins
exports.updateUser = handlerFactory.updateOne(User)
exports.deleteUser = handlerFactory.deleteOne(User);
