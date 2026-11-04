export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

export const badRequest = (msg, extra) => new HttpError(422, msg, extra);
export const notFound = (msg = 'No encontramos lo que buscas.') => new HttpError(404, msg);
export const forbidden = (msg, extra) => new HttpError(403, msg, extra);
