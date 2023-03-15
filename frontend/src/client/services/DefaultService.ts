/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Q } from '../models/Q';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class DefaultService {

    /**
     * Hello World
     * @returns any Successful Response
     * @throws ApiError
     */
    public static helloWorldGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
        });
    }

    /**
     * Post
     * @param requestBody
     * @returns string Successful Response
     * @throws ApiError
     */
    public static postQueryPost(
        requestBody: Q,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/query',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
