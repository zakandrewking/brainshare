/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Annotations } from '../models/Annotations';
import type { ArticleRequest } from '../models/ArticleRequest';
import type { ArticleResponse } from '../models/ArticleResponse';
import type { ChatRequest } from '../models/ChatRequest';
import type { ChatResponse } from '../models/ChatResponse';
import type { DocToAnnotate } from '../models/DocToAnnotate';
import type { FileToAnnotate } from '../models/FileToAnnotate';
import type { RunAnnotateFileStatus } from '../models/RunAnnotateFileStatus';
import type { RunAnnotateFileTask } from '../models/RunAnnotateFileTask';
import type { RunAnnotateStatus } from '../models/RunAnnotateStatus';
import type { RunAnnotateTask } from '../models/RunAnnotateTask';

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
     * Post Run Annotate File
     * @param requestBody
     * @returns RunAnnotateFileTask Successful Response
     * @throws ApiError
     */
    public static postRunAnnotateFileRunAnnotateFilePost(
        requestBody: FileToAnnotate,
    ): CancelablePromise<RunAnnotateFileTask> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/run/annotate-file',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get Run Annotate File
     * @param taskId
     * @returns RunAnnotateFileStatus Successful Response
     * @throws ApiError
     */
    public static getRunAnnotateFileRunAnnotateFileTaskIdGet(
        taskId: string,
    ): CancelablePromise<RunAnnotateFileStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/run/annotate-file/{task_id}',
            path: {
                'task_id': taskId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Post Run Annotate
     * @param requestBody
     * @returns RunAnnotateTask Successful Response
     * @throws ApiError
     */
    public static postRunAnnotateRunAnnotatePost(
        requestBody: DocToAnnotate,
    ): CancelablePromise<RunAnnotateTask> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/run/annotate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get Run Annotate
     * @param taskId
     * @returns RunAnnotateStatus Successful Response
     * @throws ApiError
     */
    public static getRunAnnotateRunAnnotateTaskIdGet(
        taskId: string,
    ): CancelablePromise<RunAnnotateStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/run/annotate/{task_id}',
            path: {
                'task_id': taskId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Post Annotate
     * Must return within 60 seconds or the fly.io proxy will time out
     * @param requestBody
     * @returns Annotations Successful Response
     * @throws ApiError
     */
    public static postAnnotateAnnotatePost(
        requestBody: DocToAnnotate,
    ): CancelablePromise<Annotations> {
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
