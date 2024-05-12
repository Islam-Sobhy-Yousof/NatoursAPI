const mongoose = require('mongoose');
const dotenv = require('dotenv');

/**
 * this handels any top levele unhandeld exception
 * such as console.log(anything that is not defind)
 * BUT if there is something went wrong inside a function or class then it won't work
 */
process.on('uncaughtException', (err) => {
  console.log('Error UNCAUGHT EXCEPTION 🔥');
  console.log(err.name, err.message);
  console.log('Server is Shutting Down... 🙅');
  process.exit(1);
});
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
const localDB = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('DB Connection Was successful');
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server is Listening On Port ${port}... 💻`);
});

//This event will be fired at every promise rejection like
//DB fail to connect
process.on('unhandledRejection', (err) => {
  console.log('Error UNHANDELED REJECTION 🔥');
  console.log(err.name, err.message);
  console.log('Server is Shutting Down... 🙅');
  server.close(() => {
    process.exit(1);
  });
});
//this catch any uncaught error might happens in the program for instance
// => console.log(x) => x is not defiend
