import {
  CODE_REGEX,
  generateShortCode,
  isValidUrl,
} from "../services/generateShortcode";
import { UrlModel } from "../models/urlSchems";
import { getExpiryDate } from "../services/generateExpiryDate";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../utils/response/responseFormatters";
import {
  ALREADY_IN_USE,
  BAD_REQUEST,
  DATA_EXPIRED,
  ERROR_MSG_SOMETHING_WENT_WRONG,
  GET_ITEMS_SUCCESS_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  INVALID_DATA,
  NO_DATA_FOUND,
} from "../utils/response/responseMessage";


//create short code controller
const createShortCode = async (req: any, res: any) => {
  try {
    const { originalUrl, customizedCode, expiryDays, expiryDate } = req.body;

    // Validate original URL
    if (!originalUrl || isValidUrl(originalUrl) === false) {
      return createErrorResponse(res, INVALID_DATA);
    }

    let shortCode: string;

    // Handle custom short code
    if (customizedCode) {
      if (!CODE_REGEX.test(customizedCode)) {
        return createErrorResponse(res, INVALID_DATA);
      }

      const existing = await UrlModel.findOne({ shortCode: customizedCode });
      if (existing) {
        return createErrorResponse(res, ALREADY_IN_USE);
      }

      shortCode = customizedCode;
    } else {
      // Generate unique short code
      let attempts = 0;
      while (true) {
        const candidate = generateShortCode();
        const clash = await UrlModel.exists({ shortCode: candidate });

        if (!clash) {
          shortCode = candidate;
          break;
        }

        if (++attempts > 5) {
          return createErrorResponse(res, BAD_REQUEST);
        }
      }
    }

    // Base URL check
    const base = process.env.BASE_URL?.replace(/\/+$/, "");
    if (!base) {
      return createErrorResponse(res, INTERNAL_SERVER_ERROR_MESSAGE);
    }

    const shortUrl = `${base}/${shortCode}`;

    // Calculate expiry date
    let expiresAt: Date | null;
    try {
      expiresAt = getExpiryDate(expiryDays, expiryDate);
    } catch (err: any) {
      return createErrorResponse(res, err.message, err);
    }

    // Save to DB
    const newUrl = await UrlModel.create({
      originalUrl,
      shortCode,
      shortUrl,
      expiresAt,
      customizedCode,
    });

    return createSuccessResponse(res, newUrl, "Short URL created");
  } catch (err: any) {
    console.error("Error in createShortCode:", err);
    return createErrorResponse(res, ERROR_MSG_SOMETHING_WENT_WRONG, err);
  }
};

//redirect to original url controller
const redirectToOriginal = async (req: any, res: any) => {
  try {
    const { shortCode } = req.params;

    //find the url entry by short code and increment clicks
    const urlEntry = await UrlModel.findOneAndUpdate(
      { shortCode: shortCode },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    //  check if url entry exists
    if (!urlEntry) {
      createErrorResponse(res, NO_DATA_FOUND);
    }

    //check if url is expired
    if (urlEntry?.expiresAt && urlEntry?.expiresAt < new Date()) {
      return createErrorResponse(res, DATA_EXPIRED, 410);
    }

    return createSuccessResponse(
      res,
      urlEntry?.originalUrl,
      GET_ITEMS_SUCCESS_MESSAGE
    );
  } catch (err: any) {
    createErrorResponse(res, INTERNAL_SERVER_ERROR_MESSAGE, err);
  }
};

export { createShortCode, redirectToOriginal };
