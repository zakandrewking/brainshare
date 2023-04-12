/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type ResourceMatch = {
    type: ResourceMatch.type;
    name: string;
    url: string;
};

export namespace ResourceMatch {

    export enum type {
        SPECIES = 'species',
        CHEMICAL = 'chemical',
    }


}

