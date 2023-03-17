/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Document } from '../models/Document';
import type { DocumentResponse } from '../models/DocumentResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class DefaultService {

    /**
     * Health
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }

    /**
     * Document
     * @param requestBody
     * @returns DocumentResponse Successful Response
     * @throws ApiError
     */
    public static documentDocumentPost(
        requestBody: Document,
    ): CancelablePromise<DocumentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/document',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
