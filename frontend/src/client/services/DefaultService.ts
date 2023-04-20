/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnnotateRequest } from '../models/AnnotateRequest';
import type { AnnotateResponse } from '../models/AnnotateResponse';
import type { ArticleRequest } from '../models/ArticleRequest';
import type { ArticleResponse } from '../models/ArticleResponse';
import type { ChatRequest } from '../models/ChatRequest';
import type { ChatResponse } from '../models/ChatResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class DefaultService {

    /**
     * Get Health
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getHealthHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }

    /**
     * Post Annotate
     * @param requestBody
     * @returns AnnotateResponse Successful Response
     * @throws ApiError
     */
    public static postAnnotateAnnotatePost(
        requestBody: AnnotateRequest,
    ): CancelablePromise<AnnotateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/annotate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Post Article
     * @param requestBody
     * @returns ArticleResponse Successful Response
     * @throws ApiError
     */
    public static postArticleArticlePost(
        requestBody: ArticleRequest,
    ): CancelablePromise<ArticleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/article',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Post Chat
     * @param requestBody
     * @returns ChatResponse Successful Response
     * @throws ApiError
     */
    public static postChatChatPost(
        requestBody: ChatRequest,
    ): CancelablePromise<ChatResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/chat',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
