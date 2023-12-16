import { useState } from "react";

export default function useTask<T extends Function, U extends Function>(
  runFn: T,
  statusFn: U
  //   cancelFn: V,
) {
  //   const [status, setStatus] = useState<RunStatus | null>(null);

  //   // When we have a job, we poll for the status
  //   useEffect(() => {
  //     let timeout: NodeJS.Timeout | null = null;
  //     const _checkStatus = async (jobId: number) => {};
  //     if (timeout) clearTimeout(timeout);
  //     timeout = setTimeout(() => _checkStatus(jobId), pollIntervalMs);
  //     if (isUpdatingJob) {
  //       // This will run once immediately and then every few seconds
  //       _checkStatus(isUpdatingJob);
  //     }
  //     return () => {
  //       if (timeout) clearTimeout(timeout);
  //     };
  //   }, [isUpdatingJob]);

  return {
    run: (...args: any[]) => runFn(...args),
    // cancel: () => cancelFn(),
    // status: null,
    // error: null,
  };
}
