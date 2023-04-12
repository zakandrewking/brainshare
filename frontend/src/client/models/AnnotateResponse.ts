/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CrossrefWork } from './CrossrefWork';
import type { ResourceMatch } from './ResourceMatch';

export type AnnotateResponse = {
    categories: Array<ResourceMatch>;
    tags: Array<string>;
    crossref_work?: CrossrefWork;
    tokens: number;
};

