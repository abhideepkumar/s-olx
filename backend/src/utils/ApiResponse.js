class ApiResponse {
  constructor(statusCode, message = 'Success', data) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode<400;
    this.errors = false;
  }
}

export { ApiResponse };
