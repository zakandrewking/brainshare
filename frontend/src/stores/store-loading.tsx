import { StoreApi } from "zustand";

export enum LoadingState {
  UNLOADED = "unloaded",
  LOADING = "loading",
  LOADED = "loaded",
  ERROR = "error",
}

export interface LoadingStateAll<D> {
  loadingState: LoadingState;
  prefixedId?: string;
  error?: Error;
  data?: D;
  abortController?: AbortController;
}

export interface LoadingStateBaseUnloaded<D> extends LoadingStateAll<D> {
  loadingState: LoadingState.UNLOADED;
}

export interface LoadingStateBaseLoading<D> extends LoadingStateAll<D> {
  loadingState: LoadingState.LOADING;
  prefixedId: string;
  abortController: AbortController;
}

export interface LoadingStateBaseError<D> extends LoadingStateAll<D> {
  loadingState: LoadingState.ERROR;
  prefixedId: string;
  error: Error;
}

export interface LoadingStateBaseLoaded<D> extends LoadingStateAll<D> {
  loadingState: LoadingState.LOADED;
  prefixedId: string;
  data: D;
}

export type LoadingStateBase<D> =
  | LoadingStateBaseUnloaded<D>
  | LoadingStateBaseLoading<D>
  | LoadingStateBaseError<D>
  | LoadingStateBaseLoaded<D>;

async function loadData<D, S extends LoadingStateBase<D>>(
  load: (prefixedId: string) => Promise<Partial<D> | null>,
  set: StoreApi<S>["setState"],
  prefixedId: string,
  initialData: D,
  abortWithController?: AbortController,
  storeName?: string
): Promise<void> {
  if (abortWithController) {
    abortWithController.abort();
  }
  const abortController = new AbortController();
  const state: LoadingStateBaseLoading<D> = {
    loadingState: LoadingState.LOADING,
    prefixedId,
    abortController,
  };
  console.log(`[${storeName}] Starting load for ${prefixedId}`);
  //   TODO maybe a smarter llm can get rid of this `as`
  set(state as Partial<S>);
  let data: Partial<D> | undefined | null;
  try {
    data = await load(prefixedId);
  } catch (error) {
    console.error(`[${storeName}] Failed to load ${prefixedId}:`, error);
    const state: LoadingStateBaseError<D> = {
      loadingState: LoadingState.ERROR,
      prefixedId,
      error: error as Error,
    };
    set(state as Partial<S>);
  }
  if (abortController.signal.aborted) {
    console.log(`[${storeName}] Load canceled for ${prefixedId}`);
    const state: LoadingStateBaseError<D> = {
      loadingState: LoadingState.ERROR,
      prefixedId,
      error: new Error("Load canceled"),
    };
    set(state as Partial<S>);
  } else if (data === null) {
    // New data
    console.log(`[${storeName}] Initializing new data for ${prefixedId}`);
    const state: LoadingStateBaseLoaded<D> = {
      loadingState: LoadingState.LOADED,
      prefixedId,
      data: initialData,
    };
    set(state as Partial<S>);
  } else if (data) {
    console.log(`[${storeName}] Loaded data for ${prefixedId}`);
    const state: LoadingStateBaseLoaded<D> = {
      loadingState: LoadingState.LOADED,
      prefixedId,
      data: {
        ...initialData,
        ...data,
      },
    };
    set(state as Partial<S>);
  } else if (data === undefined) {
    console.error(
      `[${storeName}] Failed to load ${prefixedId}; data is undefined`
    );
    const state: LoadingStateBaseError<D> = {
      loadingState: LoadingState.ERROR,
      prefixedId,
      error: new Error("Failed to load"),
    };
    set(state as Partial<S>);
  }
}

export async function loadDataByPrefixedId<D, S extends LoadingStateBase<D>>(
  set: StoreApi<S>["setState"],
  get: StoreApi<S>["getState"],
  prefixedId: string,
  load: (prefixedId: string) => Promise<Partial<D> | null>,
  initialData: D,
  storeName: string
) {
  // Acceptable states:
  // - UNLOADED: load the table
  // - LOADING: if prefixedId is the same as the current one, do nothing
  // - LOADING: if prefixedId is new, start a new load
  // - LOADED: if prefixedId is the same as the current one, do nothing
  // - LOADED: if prefixedId is new, load
  // - ERROR: load the table
  const state = get();
  if (
    [LoadingState.UNLOADED, LoadingState.ERROR].includes(state.loadingState)
  ) {
    await loadData(load, set, prefixedId, initialData, undefined, storeName);
  } else if (state.loadingState === LoadingState.LOADING) {
    if (prefixedId === state.prefixedId) {
      console.log(`[${storeName}] Already loading ${prefixedId}`);
      return;
    } else {
      await loadData(load, set, prefixedId, initialData, undefined, storeName);
    }
  } else if (state.loadingState === LoadingState.LOADED) {
    if (prefixedId === state.prefixedId) {
      console.log(`[${storeName}] Already loaded ${prefixedId}`);
      return;
    } else {
      await loadData(load, set, prefixedId, initialData, undefined, storeName);
    }
  }
}
