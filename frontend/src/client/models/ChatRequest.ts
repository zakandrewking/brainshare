/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChatMessage } from './ChatMessage';

export type ChatRequest = {
    history: Array<ChatMessage>;
    model?: ChatRequest.model;
};

export namespace ChatRequest {

    export enum model {
        GPT_3_5_TURBO = 'gpt-3.5-turbo',
        GPT_4 = 'gpt-4',
    }


}

