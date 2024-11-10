# Backend of S-OLX

| Status Code | Name                      | Description                                                                           |
|-------------|---------------------------|---------------------------------------------------------------------------------------|
| **100**     | Continue                  | The server has received the request headers; client should proceed to send the body.  |
| **101**     | Switching Protocols       | The server is switching protocols as requested by the client.                         |
| **200**     | OK                        | The request has succeeded; response content is returned (common for GET, POST).       |
| **201**     | Created                   | The request has been fulfilled, resulting in the creation of a new resource.          |
| **202**     | Accepted                  | The request has been accepted for processing but is not yet completed.                |
| **204**     | No Content                | The server successfully processed the request but there is no content to send.        |
| **301**     | Moved Permanently         | The requested resource has been permanently moved to a new URL.                       |
| **302**     | Found                     | The resource was found but resides at a different URL temporarily.                    |
| **304**     | Not Modified              | The resource has not been modified since the last request (used for caching).         |
| **400**     | Bad Request               | The server could not understand the request due to invalid syntax.                    |
| **401**     | Unauthorized              | Authentication is required and has failed or not been provided.                       |
| **403**     | Forbidden                 | The server understands the request but refuses to authorize it.                       |
| **404**     | Not Found                 | The requested resource could not be found on the server.                              |
| **405**     | Method Not Allowed        | The request method is known but not supported for the requested resource.             |
| **409**     | Conflict                  | The request could not be processed due to a conflict (e.g., duplicate entries).       |
| **422**     | Unprocessable Entity      | The server understands the content type but cannot process the instructions (validation errors). |
| **500**     | Internal Server Error     | A generic server error; the server is unsure of the exact problem.                    |
| **501**     | Not Implemented           | The server does not support the functionality required to fulfill the request.        |
| **502**     | Bad Gateway               | The server received an invalid response from an upstream server.                      |
| **503**     | Service Unavailable       | The server is not ready to handle the request (overloaded or down for maintenance).   |
| **504**     | Gateway Timeout           | The server did not receive a timely response from an upstream server.                 |
