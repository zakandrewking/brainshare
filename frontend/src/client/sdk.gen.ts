// This file is auto-generated by @hey-api/openapi-ts

import type { Options as ClientOptions, TDataShape, Client } from '@hey-api/client-next';
import type { SuggestWidgetSuggestWidgetPostData, SuggestWidgetSuggestWidgetPostResponse, SuggestWidgetSuggestWidgetPostError, GetHealthHealthGetData, GetSuggestCustomTypeSuggestCustomTypePostData, GetSuggestCustomTypeSuggestCustomTypePostResponse, GetSuggestCustomTypeSuggestCustomTypePostError, GetIdentifyColumnIdentifyColumnPostData, GetIdentifyColumnIdentifyColumnPostResponse, GetIdentifyColumnIdentifyColumnPostError } from './types.gen';
import { client as _heyApiClient } from './client.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
};

/**
 * Suggest Widget
 * Generate a widget suggestion based on the provided columns and existing widgets.
 */
export const suggestWidgetSuggestWidgetPost = <ThrowOnError extends boolean = false>(options: Options<SuggestWidgetSuggestWidgetPostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<SuggestWidgetSuggestWidgetPostResponse, SuggestWidgetSuggestWidgetPostError, ThrowOnError>({
        url: '/suggest-widget',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Get Health
 */
export const getHealthHealthGet = <ThrowOnError extends boolean = false>(options?: Options<GetHealthHealthGetData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<unknown, unknown, ThrowOnError>({
        url: '/health',
        ...options
    });
};

/**
 * Get Suggest Custom Type
 */
export const getSuggestCustomTypeSuggestCustomTypePost = <ThrowOnError extends boolean = false>(options: Options<GetSuggestCustomTypeSuggestCustomTypePostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<GetSuggestCustomTypeSuggestCustomTypePostResponse, GetSuggestCustomTypeSuggestCustomTypePostError, ThrowOnError>({
        url: '/suggest/custom-type',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Get Identify Column
 */
export const getIdentifyColumnIdentifyColumnPost = <ThrowOnError extends boolean = false>(options: Options<GetIdentifyColumnIdentifyColumnPostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<GetIdentifyColumnIdentifyColumnPostResponse, GetIdentifyColumnIdentifyColumnPostError, ThrowOnError>({
        url: '/identify/column',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};