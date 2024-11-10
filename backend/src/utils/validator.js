import { ApiError } from "./ApiError.js";  

export const validateFields = (data) => {
  const errors = {};

  if (!data) {
    throw new ApiError(400, "No data provided");
  }

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors[key] = `${key} is required`;
    }
  });

  if (Object.keys(errors).length !== 0) {
    throw new ApiError(400, "Error in validating fields", errors);
  }

  return true;
};