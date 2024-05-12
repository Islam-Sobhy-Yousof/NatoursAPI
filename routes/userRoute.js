const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get('/getMe',authController.protect,userController.getMe,userController.getUser)
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect)
router.patch('/updateMyPassword',authController.updatePassword)
router.patch('/updateNameAndEmail',userController.updateMe)
router.delete('/deleteUser',userController.deleteMe);

router.use(authController.restrictTo('admin'))
router
  .route('/')
  .get(userController.getAllUsers)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
