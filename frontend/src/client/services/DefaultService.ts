/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Annotations } from '../models/Annotations';
import type { ChatRequest } from '../models/ChatRequest';
import type { ChatResponse } from '../models/ChatResponse';
import type { DocToAnnotate } from '../models/DocToAnnotate';
import type { RunAnnotateStatus } from '../models/RunAnnotateStatus';
import type { RunAnnotateTask } from '../models/RunAnnotateTask';
import type { SyncedFolderToUpdate } from '../models/SyncedFolderToUpdate';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class DefaultService {

    /**
     * Get Health
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }

    /**
     * Post Run Update Synced Folder
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static postRunUpdateSyncedFolder(
        requestBody: SyncedFolderToUpdate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/run/update-synced-folder',
            body: requestBody,
            mediaType: 'application/json',
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
    public static postRunAnnotate(
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
    public static getRunAnnotate(
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
    public static postAnnotate(
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
     * Post Chat
     * @param requestBody
     * @returns ChatResponse Successful Response
     * @throws ApiError
     */
    public static postChat(
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
