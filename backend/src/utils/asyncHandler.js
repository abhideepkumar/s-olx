// promise handler
// const asyncHandler = (requestHandler) => {
//   (req, res, next) => {
//     Promise.resolve(requestHandler(req, res, next)).catch((err) => {
//       next(err);
//     });
//   };
// };

// try catch handler
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    err.status(err.code || 500).json({
      success: false,
      message: err.message,
    });
    console.log('Error found', err);
  }
};
