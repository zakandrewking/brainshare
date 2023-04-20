/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CrossrefWork } from './CrossrefWork';

export type ArticleRequest = {
    text: string;
    crossref_work: CrossrefWork;
    user_id: string;
};

