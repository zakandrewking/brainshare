/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CrossrefWorkAuthor } from './CrossrefWorkAuthor';

export type CrossrefWork = {
    title: string;
    authors: Array<CrossrefWorkAuthor>;
    journal?: string;
    doi: string;
};

