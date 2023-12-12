/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChatContext } from './ChatContext';
import type { ChatMessage } from './ChatMessage';

export type ChatRequest = {
    history: Array<ChatMessage>;
    model: ChatRequest.model;
    context?: ChatContext;
};

export namespace ChatRequest {

    export enum model {
        GPT_3_5_TURBO = 'gpt-3.5-turbo',
        GPT_4_1106_PREVIEW = 'gpt-4-1106-preview',
    }


}

