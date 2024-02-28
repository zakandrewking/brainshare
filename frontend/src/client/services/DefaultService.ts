/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Annotations } from '../models/Annotations';
import type { ChatRequest } from '../models/ChatRequest';
import type { ChatResponse } from '../models/ChatResponse';
import type { CreateDatasetRequest } from '../models/CreateDatasetRequest';
import type { DocToAnnotate } from '../models/DocToAnnotate';
import type { RunAnnotateStatus } from '../models/RunAnnotateStatus';
import type { RunAnnotateTask } from '../models/RunAnnotateTask';
import type { SyncedFolderToUpdate } from '../models/SyncedFolderToUpdate';
import type { SyncFileToDatasetRequest } from '../models/SyncFileToDatasetRequest';

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
     * Post Task Sync File To Dataset
     * Clean up any existing tasks and start a new one.
     *
     * Modeled after post_task_sync_folder.
     * @param requestBody
     * @returns string Successful Response
     * @throws ApiError
     */
    public static postTaskSyncFileToDataset(
        requestBody: SyncFileToDatasetRequest,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/task/sync-file-to-dataset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Post Task Sync Folder
     * Clean up any existing tasks and start a new one
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static postTaskSyncFolder(
        requestBody: SyncedFolderToUpdate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/task/sync-folder',
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

    /**
     * Post Chat With Context
     * @param requestBody
     * @returns ChatResponse Successful Response
     * @throws ApiError
     */
    public static postChatWithContext(
        requestBody: ChatRequest,
    ): CancelablePromise<ChatResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/chat-with-context',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Post Create Dataset
     * this will be synchronous for now
     * @param requestBody
     * @returns number Successful Response
     * @throws ApiError
     */
    public static postCreateDataset(
        requestBody: CreateDatasetRequest,
    ): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/create-dataset',
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
            url: '/task/annotate',
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
            url: '/task/annotate/{task_id}',
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

}
