export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const badGateway = (message) => new HttpError(502, message);
export const conflict = (message) => new HttpError(409, message);
