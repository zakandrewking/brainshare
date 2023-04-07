/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CrossrefWork } from './CrossrefWork';

export type AnnotateResponse = {
    categories: Array<string>;
    tags: Array<string>;
    crossref_work?: CrossrefWork;
    tokens: number;
};

